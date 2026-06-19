import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { TrialRequestButton } from '@/components/TrialRequestButton';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

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
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="font-sans antialiased">
        {children}
        <TrialRequestButton />
      </body>
    </html>
  );
}
