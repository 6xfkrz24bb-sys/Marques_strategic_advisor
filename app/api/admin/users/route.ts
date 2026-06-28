import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer, serverError } from '@/lib/http';
import { isAdminEmail } from '@/lib/usage';

function key(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  const requester = await getUserFromBearer(request).catch(() => null);
  if (!requester) return badRequest('Não autorizado.', 401);
  if (!isAdminEmail(requester.email)) return badRequest('Acesso restrito aos administradores.', 403);

  const supabase = createAdminClient();

  const [profilesResult, suppliersResult, leadsResult, accessResult, chatResult] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,created_at').order('created_at', { ascending: false }),
    supabase.from('suppliers').select('user_id,legal_name,trade_name,email,whatsapp,city,state,category,contact_name,notes,created_at').order('created_at', { ascending: false }),
    supabase.from('leads').select('name,email,whatsapp,source,status,created_at').order('created_at', { ascending: false }),
    supabase.from('advisor_access').select('user_id,advisor_id,expires_at,status'),
    supabase.from('chat_messages').select('user_id,created_at').eq('role', 'user').order('created_at', { ascending: false })
  ]);

  if (profilesResult.error) return serverError();
  if (suppliersResult.error) return serverError();
  if (leadsResult.error) return serverError();
  if (accessResult.error) return serverError();
  if (chatResult.error) return serverError();

  const byEmail = new Map<string, any>();

  (profilesResult.data || []).forEach((profile: any) => {
    const email = key(profile.email);
    if (!email) return;
    byEmail.set(email, {
      name: profile.full_name || profile.email,
      email: profile.email,
      phone: '',
      createdAt: profile.created_at,
      source: 'Cadastro',
      businessName: '',
      businessSegment: '',
      accessStatus: 'Sem acesso',
      advisors: 0,
      expiresAt: null,
      messagesSent: 0,
      lastChatAt: null,
      userId: profile.id
    });
  });

  (leadsResult.data || []).forEach((lead: any) => {
    const email = key(lead.email);
    if (!email) return;
    const current = byEmail.get(email) || { email: lead.email };
    byEmail.set(email, {
      ...current,
      name: current.name || lead.name || lead.email,
      phone: current.phone || lead.whatsapp || '',
      createdAt: current.createdAt || lead.created_at,
      source: current.source || lead.source || 'Lead',
      leadStatus: lead.status || ''
    });
  });

  (suppliersResult.data || []).forEach((form: any) => {
    const email = key(form.email);
    if (!email) return;
    const current = byEmail.get(email) || { email: form.email };
    byEmail.set(email, {
      ...current,
      name: current.name || form.legal_name || form.email,
      phone: current.phone || form.whatsapp || '',
      businessName: current.businessName || form.legal_name || '',
      businessSegment: current.businessSegment || form.trade_name || '',
      createdAt: current.createdAt || form.created_at,
      source: 'Diagnóstico',
      userId: current.userId || form.user_id
    });
  });

  const accessByUser = new Map<string, any[]>();
  (accessResult.data || []).forEach((row: any) => {
    accessByUser.set(row.user_id, [...(accessByUser.get(row.user_id) || []), row]);
  });

  const chatByUser = new Map<string, { count: number; lastAt: string | null }>();
  (chatResult.data || []).forEach((row: any) => {
    const current = chatByUser.get(row.user_id) || { count: 0, lastAt: null };
    chatByUser.set(row.user_id, { count: current.count + 1, lastAt: current.lastAt || row.created_at });
  });

  const enrichedUsers = Array.from(byEmail.values()).map((user: any) => {
    const access = user.userId ? accessByUser.get(user.userId) || [] : [];
    const active = access.filter((row) => row.status === 'active');
    const permanent = active.some((row) => !row.expires_at);
    const trial = active.some((row) => row.expires_at && new Date(row.expires_at).getTime() >= Date.now());
    const chat = user.userId ? chatByUser.get(user.userId) : null;

    return {
      name: user.name || user.email,
      email: user.email,
      createdAt: user.createdAt || null,
      accessStatus: permanent ? 'Acesso ativo' : trial ? 'Trial ativo' : active.length ? 'Acesso expirado' : 'Sem acesso',
      source: user.source || 'Cadastro',
      messagesSent: chat?.count || 0,
      hasBusinessForm: Boolean(user.businessName || user.businessSegment)
    };
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const diagnostics = (suppliersResult.data || []).map((diagnostic: any) => ({
    legal_name: diagnostic.legal_name || '',
    trade_name: diagnostic.trade_name || '',
    email: diagnostic.email || '',
    whatsapp: diagnostic.whatsapp || '',
    city: diagnostic.city || '',
    state: diagnostic.state || '',
    category: diagnostic.category || '',
    contact_name: diagnostic.contact_name || '',
    notes: diagnostic.notes || '',
    created_at: diagnostic.created_at || null
  }));

  return NextResponse.json({
    ok: true,
    summary: {
      totalUsers: enrichedUsers.length,
      trialUsers: enrichedUsers.filter((user) => user.accessStatus === 'Trial ativo').length,
      activeUsers: enrichedUsers.filter((user) => user.accessStatus === 'Acesso ativo').length,
      usersWithChat: enrichedUsers.filter((user) => user.messagesSent > 0).length,
      usersWithBusinessForm: enrichedUsers.filter((user) => user.hasBusinessForm).length
    },
    users: enrichedUsers.map(({ hasBusinessForm, ...user }) => user),
    diagnostics
  });
}
