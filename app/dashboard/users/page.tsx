'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import toast, { Toaster } from 'react-hot-toast';
import { Users, Plus, Edit2, Trash2, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

interface UserFormData {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (response.status === 403) {
        toast.error('Anda tidak memiliki akses ke halaman ini');
        router.push('/dashboard');
        return;
      }

      const result = await response.json();
      if (response.ok) {
        setUsers(result.data || []);
      } else {
        toast.error(result.message || 'Gagal memuat data users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setIsEditing(true);
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setIsEditing(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = '/api/users';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || (isEditing ? 'User berhasil diupdate' : 'User berhasil ditambahkan'));
        handleCloseDialog();
        loadUsers();
      } else {
        toast.error(result.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('User berhasil dihapus');
        loadUsers();
      } else {
        toast.error(result.message || 'Gagal menghapus user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Terjadi kesalahan saat menghapus user');
    }
  };

  const formatDate = (dateString: Date) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when users data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">User Management</h1>
                  <p className="text-slate-600 text-xs sm:text-sm">Kelola pengguna sistem</p>
                </div>
              </div>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Tambah User
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2">
                <UserCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Daftar User
              </CardTitle>
              <CardDescription className="text-emerald-100 text-xs sm:text-sm">
                Total {users.length} pengguna terdaftar | Halaman {currentPage} dari {totalPages || 1}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-600 text-sm">Memuat data...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-50" />
                  <p className="text-sm">Belum ada user</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Terdaftar</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentUsers.map((user, index) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{indexOfFirstItem + index + 1}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={user.role === 'admin' ? 'default' : 'secondary'}
                                className={
                                  user.role === 'admin'
                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                    : 'bg-slate-500 hover:bg-slate-600'
                                }
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => handleOpenDialog(user)}
                                  variant="outline"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDelete(user.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {currentUsers.map((user, index) => (
                      <Card key={user.id} className="border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                                {indexOfFirstItem + index + 1}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-800 text-sm">{user.name}</h3>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                            <Badge
                              variant={user.role === 'admin' ? 'default' : 'secondary'}
                              className={`text-xs ${
                                user.role === 'admin'
                                  ? 'bg-emerald-500 hover:bg-emerald-600'
                                  : 'bg-slate-500 hover:bg-slate-600'
                              }`}
                            >
                              {user.role}
                            </Badge>
                          </div>
                          <div className="mb-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <UserCircle className="w-3.5 h-3.5" />
                              <span>Terdaftar: {formatDate(user.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleOpenDialog(user)}
                              variant="outline"
                              size="sm"
                              className="flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs gap-1.5"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(user.id)}
                              variant="outline"
                              size="sm"
                              className="flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              {!loading && users.length > 0 && totalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Info Text */}
                    <div className="text-xs sm:text-sm text-slate-600">
                      Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, users.length)} dari {users.length} pengguna
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* Previous Button */}
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {/* First Page */}
                        {currentPage > 2 && (
                          <>
                            <Button
                              onClick={() => handlePageChange(1)}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm"
                            >
                              1
                            </Button>
                            {currentPage > 3 && (
                              <span className="px-1 text-slate-400">...</span>
                            )}
                          </>
                        )}

                        {/* Current and nearby pages */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            return page === currentPage || 
                                   page === currentPage - 1 || 
                                   page === currentPage + 1;
                          })
                          .map(page => (
                            <Button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              variant={page === currentPage ? 'default' : 'outline'}
                              size="sm"
                              className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm ${
                                page === currentPage
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                                  : ''
                              }`}
                            >
                              {page}
                            </Button>
                          ))}

                        {/* Last Page */}
                        {currentPage < totalPages - 1 && (
                          <>
                            {currentPage < totalPages - 2 && (
                              <span className="px-1 text-slate-400">...</span>
                            )}
                            <Button
                              onClick={() => handlePageChange(totalPages)}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm"
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Next Button */}
                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {isEditing ? 'Edit User' : 'Tambah User Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEditing
                ? 'Update informasi user. Kosongkan password jika tidak ingin mengubahnya.'
                : 'Isi form di bawah untuk menambahkan user baru.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">Nama</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm">
                  Password {isEditing && <span className="text-xs">(Kosongkan jika tidak ingin mengubah)</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="text-xs sm:text-sm"
                  required={!isEditing}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="role" className="text-xs sm:text-sm">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-9 sm:h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSaving}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 w-full sm:w-auto text-xs sm:text-sm"
              >
                {isSaving ? 'Menyimpan...' : isEditing ? 'Update' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
