import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'RepoAnalyser — Deep GitHub Repository Insights',
  description: 'Analyse any public GitHub repository for health, commit patterns, contributor stats, language breakdown, and AI-powered architecture summaries.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ paddingTop: '64px', minHeight: '100vh' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
