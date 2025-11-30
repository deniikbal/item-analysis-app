'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavbarClientProps {
  user: { name: string } | null;
}

export function NavbarClient({ user }: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        router.push('/auth/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (user) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition">
                ANABUT
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/dashboard">
                  <Button 
                    variant="ghost"
                    size="sm"
                    className={pathname === '/dashboard' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-gray-700 hover:bg-gray-100'}
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link href="/upload-jawaban">
                  <Button 
                    variant="ghost"
                    size="sm"
                    className={pathname === '/upload-jawaban' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-gray-700 hover:bg-gray-100'}
                  >
                    Upload Jawaban
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Halo, {user.name}</span>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  } else {
    return (
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Analisis Butir Soal</h1>
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
        </div>
      </header>
    );
  }
}
