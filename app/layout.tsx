import './globals.css';
import type { Metadata } from 'next';
import { validateRequest } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Analisis Butir Soal',
  description: 'Aplikasi untuk analisis tingkat kesukaran dan daya pembeda butir soal.',
};

async function AuthButton() {
  const { user } = await validateRequest();

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">Halo, {user.name}</span>
        <form action={async () => {
          'use server';
          const { session } = await validateRequest();
          if (session) {
            await session.invalidate();
          }
          redirect('/auth/login');
        }}>
          <Button type="submit" variant="outline" size="sm">
            Logout
          </Button>
        </form>
      </div>
    );
  } else {
    return (
      <Link href="/auth/login">
        <Button variant="outline" size="sm">
          Login
        </Button>
      </Link>
    );
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Analisis Butir Soal</h1>
            <AuthButton />
          </div>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
