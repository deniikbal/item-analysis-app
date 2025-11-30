'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast, { Toaster } from 'react-hot-toast';
import { FileSpreadsheet, Trash2, Calendar, School, BookOpen, User, Edit2, Save, X, GraduationCap, ClipboardList, UserCircle, Building2 } from 'lucide-react';

interface TestData {
  id: number;
  schoolName: string | null;
  subject: string | null;
  classInfo: string | null;
  testName: string | null;
  teacherName: string | null;
  testDate: string | null;
  kkm: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TestInfo {
  schoolName: string;
  subject: string;
  classInfo: string;
  testName: string;
  competencyBasis: string;
  teacherName: string;
  teacherNip: string;
  principalName: string;
  principalNip: string;
  academicYear: string;
  testDate: string;
  kkm: string;
}

export default function DashboardPage() {
  const [testData, setTestData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testInfo, setTestInfo] = useState<TestInfo>({
    schoolName: '',
    subject: '',
    classInfo: '',
    testName: '',
    competencyBasis: '',
    teacherName: '',
    teacherNip: '',
    principalName: '',
    principalNip: '',
    academicYear: '',
    testDate: '',
    kkm: '75',
  });
  const router = useRouter();

  useEffect(() => {
    loadTestData();
    loadTestInfo();
  }, []);

  const loadTestData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-data');
      
      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      const result = await response.json();
      if (response.ok) {
        setTestData(result.data || []);
      } else {
        toast.error('Gagal memuat data');
      }
    } catch (error) {
      console.error('Error loading test data:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadTestInfo = async () => {
    try {
      const response = await fetch('/api/save-test');
      if (response.ok) {
        const { data } = await response.json();
        if (data) {
          setTestInfo({
            schoolName: data.schoolName || '',
            subject: data.subject || '',
            classInfo: data.classInfo || '',
            testName: data.testName || '',
            competencyBasis: data.competencyBasis || '',
            teacherName: data.teacherName || '',
            teacherNip: data.teacherNip || '',
            principalName: data.principalName || '',
            principalNip: data.principalNip || '',
            academicYear: data.academicYear || '',
            testDate: data.testDate || '',
            kkm: data.kkm || '75',
          });
        }
      }
    } catch (err) {
      console.error('Error loading test info:', err);
    }
  };

  const handleSaveTestInfo = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testInfo),
      });

      if (response.ok) {
        setIsEditMode(false);
        toast.success('Data berhasil disimpan!');
      } else {
        toast.error('Gagal menyimpan data');
      }
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      return;
    }

    try {
      const response = await fetch('/api/test-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        toast.success('Data berhasil dihapus');
        loadTestData();
      } else {
        toast.error('Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Terjadi kesalahan saat menghapus data');
    }
  };



  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const fields = [
    { key: 'schoolName', label: 'Nama Sekolah', placeholder: 'SMAN 1 BANTARUJEG', icon: Building2, section: 'school' },
    { key: 'subject', label: 'Mata Pelajaran', placeholder: 'GEOGRAFI', icon: BookOpen, section: 'test' },
    { key: 'classInfo', label: 'Kelas/Semester', placeholder: 'XI GBIM 1', icon: GraduationCap, section: 'test' },
    { key: 'testName', label: 'Nama Tes', placeholder: 'PSAT', icon: ClipboardList, section: 'test' },
    { key: 'competencyBasis', label: 'Kompetensi Dasar', placeholder: 'POTENSI SUMBER DAYA ALAM', icon: FileSpreadsheet, section: 'test' },
    { key: 'teacherName', label: 'Guru Mata Pelajaran', placeholder: 'REVI INDIKA, S.Pd., Gr.', icon: User, section: 'teacher' },
    { key: 'teacherNip', label: 'NIP Guru', placeholder: '199404162024212033', icon: UserCircle, section: 'teacher' },
    { key: 'principalName', label: 'Kepala Sekolah', placeholder: 'Nama Kepala Sekolah', icon: User, section: 'principal' },
    { key: 'principalNip', label: 'NIP Kepala Sekolah', placeholder: '197303021998021002', icon: UserCircle, section: 'principal' },
    { key: 'academicYear', label: 'Tahun Pelajaran', placeholder: '2024/2025', icon: Calendar, section: 'test' },
    { key: 'testDate', label: 'Tanggal Tes', placeholder: '10 JUNI 2025', type: 'date', icon: Calendar, section: 'test' },
    { key: 'kkm', label: 'KKM', placeholder: '75', icon: ClipboardList, section: 'test' },
  ];

  return (
    <>
      <Toaster position="top-right" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Data Ulangan</h1>
                <p className="text-slate-600 text-sm">Kelola informasi ulangan dan pengaturan sekolah</p>
              </div>
            </div>
          </div>

          {/* Main Form Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5" />
                  <div>
                    <CardTitle className="text-xl">Informasi Data Ulangan</CardTitle>
                    <CardDescription className="text-blue-100 text-sm">
                      {isEditMode ? 'Mode Edit - Ubah data sesuai kebutuhan' : 'Klik Edit untuk mengubah data'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isEditMode ? (
                    <Button
                      onClick={() => setIsEditMode(true)}
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 text-white hover:bg-white/30 border-white/30 backdrop-blur gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleSaveTestInfo}
                        size="sm"
                        disabled={isSaving}
                        className="bg-emerald-500 text-white hover:bg-emerald-600 gap-2 shadow-lg"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditMode(false);
                          loadTestInfo();
                        }}
                        variant="secondary"
                        size="sm"
                        className="bg-rose-500 text-white hover:bg-rose-600 gap-2"
                      >
                        <X className="w-4 h-4" />
                        Batal
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label 
                        htmlFor={field.key} 
                        className="text-sm font-semibold text-slate-700 flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4 text-slate-500" />
                        {field.label}
                      </Label>
                      <Input
                        id={field.key}
                        type={(field as any).type || 'text'}
                        placeholder={field.key === 'testDate' ? undefined : field.placeholder}
                        value={testInfo[field.key as keyof TestInfo]}
                        onChange={(e) => setTestInfo({ ...testInfo, [field.key]: e.target.value })}
                        disabled={!isEditMode}
                        className={`
                          text-sm transition-all duration-200
                          ${isEditMode 
                            ? 'border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                            : 'bg-slate-50 border-slate-200'
                          }
                        `}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Info Footer */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="p-1.5 bg-blue-100 rounded">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Data ini akan digunakan untuk membuat laporan analisis ulangan</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
