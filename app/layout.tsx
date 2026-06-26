import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ChatInputEnhancements } from '@/components/ChatInputEnhancements';
import { GoogleTag } from '@/components/GoogleTag';
import { LoggedUserDiagnosticAutofill } from '@/components/LoggedUserDiagnosticAutofill';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { TrialRequestButton } from '@/components/TrialRequestButton';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

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
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <GoogleTag />
        {children}
        <ChatInputEnhancements />
        <LoggedUserDiagnosticAutofill />
        <PWAInstallPrompt />
        <TrialRequestButton />
      </body>
    </html>
  );
}
