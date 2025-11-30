import './globals.css';
import type { Metadata } from 'next';
import { validateRequest } from '@/lib/auth-utils';
import { NavbarClient } from './navbar-client';

export const metadata: Metadata = {
  title: 'Analisis Butir Soal',
  description: 'Aplikasi untuk analisis tingkat kesukaran dan daya pembeda butir soal.',
};

async function Navbar() {
  const { user } = await validateRequest();
  return <NavbarClient user={user} />;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();
  
  return (
    <html lang="en">
      <body>
        {user && <Navbar />}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
