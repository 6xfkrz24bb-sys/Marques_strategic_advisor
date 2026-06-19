import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ChatInputEnhancements } from '@/components/ChatInputEnhancements';
import { LoggedUserDiagnosticAutofill } from '@/components/LoggedUserDiagnosticAutofill';
import { TrialRequestButton } from '@/components/TrialRequestButton';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marques Strategic Advisor',
  description: 'Consultoria executiva sob demanda com advisors especializados por pilar de gestão.',
  applicationName: 'Marques Advisor',
  appleWebApp: {
    capable: true,
    title: 'Marques Advisor',
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
        {children}
        <ChatInputEnhancements />
        <LoggedUserDiagnosticAutofill />
        <TrialRequestButton />
      </body>
    </html>
  );
}
