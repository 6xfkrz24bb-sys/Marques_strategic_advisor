import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ChatInputEnhancements } from '@/components/ChatInputEnhancements';
import { GoogleAdsPurchaseConversion } from '@/components/GoogleAdsPurchaseConversion';
import { GoogleTag } from '@/components/GoogleTag';
import { LoggedUserDiagnosticAutofill } from '@/components/LoggedUserDiagnosticAutofill';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { TrialRequestButton } from '@/components/TrialRequestButton';
import './globals.css';

export const metadata: Metadata = {
  title: 'MSA | Marques Advisors',
  description: 'Consultoria estratégica sob demanda com advisors executivos para decisões críticas de gestão.',
  applicationName: 'MSA',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/marques-icon.svg',
    shortcut: '/icons/marques-icon.svg',
    apple: '/icons/marques-icon.svg'
  },
  appleWebApp: {
    capable: true,
    title: 'MSA',
    statusBarStyle: 'black-translucent'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#020617'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <GoogleTag />
        <GoogleAdsPurchaseConversion />
        {children}
        <ChatInputEnhancements />
        <LoggedUserDiagnosticAutofill />
        <PWAInstallPrompt />
        <TrialRequestButton />
      </body>
    </html>
  );
}
