'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, LayoutDashboard, Upload, Users, LogOut } from 'lucide-react';

interface NavbarClientProps {
  user: { name: string; role: string } | null;
}

export function NavbarClient({ user }: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsMobileMenuOpen(false);
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (user) {
    return (
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 sm:gap-8">
              <Link 
                href="/dashboard" 
                className="text-lg sm:text-xl font-bold text-gray-900 hover:text-emerald-600 transition"
                onClick={closeMobileMenu}
              >
                ANABUT
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-1">
                <Link href="/dashboard" onClick={closeMobileMenu}>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className={pathname === '/dashboard' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-gray-700 hover:bg-gray-100'}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/upload-jawaban" onClick={closeMobileMenu}>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className={pathname === '/upload-jawaban' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-gray-700 hover:bg-gray-100'}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Jawaban
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/dashboard/users" onClick={closeMobileMenu}>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className={pathname === '/dashboard/users' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-gray-700 hover:bg-gray-100'}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      User Management
                    </Button>
                  </Link>
                )}
              </nav>
            </div>

            {/* Desktop User Info & Logout */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-700 truncate max-w-[150px]">Halo, {user.name}</span>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                disabled={isLoggingOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
              {/* User Info Mobile */}
              <div className="px-3 py-2 text-sm text-gray-700 font-medium border-b border-gray-200 mb-2">
                Halo, {user.name}
              </div>

              {/* Menu Items */}
              <Link href="/dashboard" onClick={closeMobileMenu}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition ${
                    pathname === '/dashboard'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
              </Link>

              <Link href="/upload-jawaban" onClick={closeMobileMenu}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition ${
                    pathname === '/upload-jawaban'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Jawaban
                </button>
              </Link>

              {user.role === 'admin' && (
                <Link href="/dashboard/users" onClick={closeMobileMenu}>
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition ${
                      pathname === '/dashboard/users'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    User Management
                  </button>
                </Link>
              )}

              {/* Logout Button Mobile */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition mt-2 border-t border-gray-200 pt-3"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </header>
    );
  } else {
    return (
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Analisis Butir Soal</h1>
          <Link href="/auth/login">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              Login
            </Button>
          </Link>
        </div>
      </header>
    );
  }
}
