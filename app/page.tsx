'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Upload, Loader, Building2, BookOpen, Users, PenTool, Target, User, Calendar, CalendarDays, BarChart3, Download } from 'lucide-react';

interface TestInfo {
  schoolName: string;
  subject: string;
  classInfo: string;
  testName: string;
  competencyBasis: string;
  teacherName: string;
  academicYear: string;
  testDate: string;
  kkm: string;
}

export default function Home() {
  const [testInfo, setTestInfo] = useState<TestInfo>({
    schoolName: '',
    subject: '',
    classInfo: '',
    testName: '',
    competencyBasis: '',
    teacherName: '',
    academicYear: '',
    testDate: '',
    kkm: '75',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any[] | null>(null);
  const [groupedStudents, setGroupedStudents] = useState<any[] | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printFormat, setPrintFormat] = useState<'A4' | 'F4'>('F4');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
      setAnalysisResults(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Silakan pilih file Excel untuk diunggah.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResults(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menganalisis file.');
      }

      const data = await response.json();
      setAnalysisResults(data.analysis);
      // Store additional data for display
      setGroupedStudents(data.groupedStudents);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan yang tidak terduga.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadgeColor = (interpretation: string) => {
    if (interpretation.includes('Mudah')) return 'bg-blue-50 text-blue-700';
    if (interpretation.includes('Sedang')) return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-700';
  };

  const getDiscriminationBadgeColor = (interpretation: string) => {
    if (interpretation.includes('Sangat Baik')) return 'badge-success';
    if (interpretation.includes('Baik')) return 'bg-emerald-50 text-emerald-700';
    if (interpretation.includes('Cukup')) return 'bg-cyan-50 text-cyan-700';
    if (interpretation.includes('Kurang')) return 'badge-warning';
    return 'badge-danger';
  };

  const getDiscriminationBadgeStyle = (interpretation: string) => {
    if (interpretation.includes('Sangat Baik')) return { backgroundColor: '#f0fdf4', color: '#15803d' };
    if (interpretation.includes('Baik')) return { backgroundColor: '#d1fae5', color: '#065f46' };
    if (interpretation.includes('Cukup')) return { backgroundColor: '#cffafe', color: '#0e7490' };
    if (interpretation.includes('Kurang')) return { backgroundColor: '#fffbeb', color: '#b45309' };
    return { backgroundColor: '#fef2f2', color: '#991b1b' };
  };

  const getDistractorEffectivenessStyle = (effectiveness: string) => {
    if (effectiveness === 'Efektif') return { backgroundColor: '#f0fdf4', color: '#15803d' };
    if (effectiveness === 'Kurang Efektif') return { backgroundColor: '#fef3c7', color: '#92400e' };
    return { backgroundColor: '#f3f4f6', color: '#6b7280' };
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printContent');
    if (!element) return;

    // Set loading state
    setLoading(true);

    try {
      // Dynamic import html2pdf untuk client-side only
      const html2pdf = (await import('html2pdf.js')).default;

      // PDF options
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Analisis-${testInfo.testName || 'Ulangan'}-${testInfo.classInfo || ''}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4',
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.page-break-avoid'
        }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:py-12 sm:px-6 print:p-0">
      <div className="max-w-6xl mx-auto print:max-w-full">
        <div className="text-center mb-10 sm:mb-12 print:hidden">
          <div className="inline-block mb-4">
            <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-sm px-6 py-2 shadow-lg">
              <span className="text-2xl">📊</span>
              <span className="text-white font-semibold text-sm">ANALISIS OTOMATIS</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent mb-3">
            Analisis Butir Soal
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium">
            Analisis tingkat kesukaran dan daya pembeda soal tes secara otomatis dan akurat
          </p>
        </div>

        <div className="mb-8 print:hidden">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-sm bg-white/95 backdrop-blur">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-md">
                  📝
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Informasi Ulangan</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Lengkapi data ujian Anda</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { key: 'schoolName', label: 'Nama Sekolah', placeholder: 'SMAN 1 BANTARUJEG' },
                  { key: 'subject', label: 'Mata Pelajaran', placeholder: 'GEOGRAFI' },
                  { key: 'classInfo', label: 'Kelas/Semester', placeholder: 'XI GBIM 1' },
                  { key: 'testName', label: 'Nama Tes', placeholder: 'PSAT' },
                  { key: 'competencyBasis', label: 'Kompetensi Dasar', placeholder: 'POTENSI SUMBER DAYA ALAM' },
                  { key: 'teacherName', label: 'Nama Pengajar', placeholder: 'REVI INDIKA, S.Pd., Gr.r' },
                  { key: 'academicYear', label: 'Tahun Pelajaran', placeholder: '2024/2025' },
                  { key: 'testDate', label: 'Tanggal Tes', placeholder: '10 JUNI 2025' },
                  { key: 'kkm', label: 'KKM (Kriteria Ketuntasan Minimal)', placeholder: '75' },
                ].map((field) => (
                  <div key={field.key} className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-700 block">
                      {field.label}
                    </label>
                    <Input
                      type="text"
                      placeholder={field.placeholder}
                      value={testInfo[field.key as keyof TestInfo]}
                      onChange={(e) => setTestInfo({ ...testInfo, [field.key]: e.target.value })}
                      className="rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-10 print:hidden">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-sm bg-white/95 backdrop-blur overflow-hidden">
            <CardHeader className="pb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-md">
                  📋
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Unggah File Excel</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Pilih file data nilai siswa Anda</p>
                </div>
              </div>
              <CardDescription className="mt-4 text-slate-600">
                Format file: <span className="font-semibold text-slate-900">Kolom 1</span> "Nama Lengkap", <span className="font-semibold text-slate-900">Kolom 2</span> "Kelas", <span className="font-semibold text-slate-900">Kolom 3+</span> jawaban siswa dengan header sebagai kunci jawaban.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="space-y-5">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="input-file"
                />

                {selectedFile && (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
                    <div className="w-8 h-8 rounded-sm bg-green-500 flex items-center justify-center text-white text-sm font-bold">✓</div>
                    <div className="flex-1">
                      <p className="text-sm text-green-900 font-semibold">{selectedFile.name}</p>
                      <p className="text-xs text-green-700 mt-0.5">File siap dianalisis</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={loading || !selectedFile}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-lg"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      <span>Sedang Menganalisis...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      <span>Mulai Analisis</span>
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg shadow-sm">
                    <p className="text-red-900 font-semibold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm bg-red-500 flex items-center justify-center text-white flex-shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <span>{error}</span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {analysisResults && analysisResults.length > 0 && (
          <>
            <div className="mb-10 flex gap-4 justify-end flex-wrap items-center print:hidden">
              <div className="flex gap-2">
                <Button
                  onClick={() => setPrintFormat('A4')}
                  variant={printFormat === 'A4' ? 'default' : 'outline'}
                  size="sm"
                  className={`rounded-lg font-semibold transition-all ${printFormat === 'A4' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-white hover:bg-slate-100 border-slate-200'}`}
                >
                  📄 A4
                </Button>
                <Button
                  onClick={() => setPrintFormat('F4')}
                  variant={printFormat === 'F4' ? 'default' : 'outline'}
                  size="sm"
                  className={`rounded-lg font-semibold transition-all ${printFormat === 'F4' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-white hover:bg-slate-100 border-slate-200'}`}
                >
                  📋 F4
                </Button>
              </div>
              <Button
                onClick={handleDownloadPDF}
                size="sm"
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Membuat PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF ({printFormat})
                  </>
                )}
              </Button>
            </div>

            <Card className="border-0 shadow-xl rounded-sm bg-white/95 backdrop-blur overflow-hidden mb-10 print:rounded-none print:shadow-none print:m-0 print:border-0 print:bg-white" id="printContent">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white text-center">
                <h2 className="text-lg font-bold mb-0.5">ANALISIS HASIL ULANGAN</h2>
                <p className="text-blue-100 text-xs font-medium">TIPE SOAL: PILIHAN GANDA</p>
              </div>

              <div className="px-3 py-2 border-b border-blue-200">
                <div className="grid grid-cols-4 md:grid-cols-4 gap-2">
                  {[
                    { label: 'NAMA SEKOLAH', value: testInfo.schoolName, Icon: Building2 },
                    { label: 'MATA PELAJARAN', value: testInfo.subject, Icon: BookOpen },
                    { label: 'KELAS/SEMESTER', value: testInfo.classInfo, Icon: Users },
                    { label: 'NAMA TES', value: testInfo.testName, Icon: PenTool },
                    { label: 'KOMPETENSI DASAR', value: testInfo.competencyBasis, Icon: Target },
                    { label: 'NAMA PENGAJAR', value: testInfo.teacherName, Icon: User },
                    { label: 'TAHUN PELAJARAN', value: testInfo.academicYear, Icon: Calendar },
                    { label: 'TANGGAL TES', value: testInfo.testDate, Icon: CalendarDays },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-200">
                      <item.Icon className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-tight leading-tight">{item.label}</p>
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.value || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <CardContent className="px-3 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Hasil Analisis Butir Soal</h2>
                </div>

                <div className="space-y-2">
                  {analysisResults.map((result, index) => (
                    <div key={index} className="page-break-avoid bg-white border-l-2 border-l-blue-600 rounded overflow-hidden shadow-sm">
                      <div className="px-2 py-2 bg-slate-50 border-b border-blue-100">
                        <div className="flex items-start gap-2 justify-start">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs text-slate-600 whitespace-nowrap flex-shrink-0">
                                Kunci: <span className="font-bold text-blue-600">{result.correctAnswer}</span>
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-slate-900">
                              {result.question}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 space-y-2.5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {/* Kesukaran Card */}
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-xs font-bold text-blue-700">Kesukaran</p>
                              <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">
                                {result.difficultyInterpretation}
                              </span>
                            </div>
                            <div className="text-center mb-1.5">
                              <span className="text-base font-bold text-blue-700">{result.difficulty}</span>
                            </div>
                            <div className="w-full h-1.5 bg-blue-200 rounded-sm overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${Math.min(parseFloat(result.difficulty) * 100, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Pembeda Card */}
                          <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-xs font-bold text-emerald-700">Pembeda</p>
                              <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
                                {result.discriminationInterpretation}
                              </span>
                            </div>
                            <div className="text-center mb-1.5">
                              <span className="text-base font-bold text-emerald-700">{result.discrimination}</span>
                            </div>
                            <div className="w-full h-1.5 bg-emerald-200 rounded-sm overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500"
                                style={{ width: `${Math.min(parseFloat(result.discrimination) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Jawaban Benar Section */}
                        <div className="bg-white rounded border border-slate-200 p-2">
                          <h4 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-3 h-3 rounded-sm bg-green-500 text-white text-xs flex-shrink-0">✓</span>
                            Benar
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 bg-amber-50 rounded border border-amber-200 text-center">
                              <p className="text-xs font-bold text-amber-700 mb-1">Atas</p>
                              <p className="text-base font-bold text-amber-600">{result.correctAnswerStats.chosenByUpper}</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                              <p className="text-xs font-bold text-blue-700 mb-1">Bawah</p>
                              <p className="text-base font-bold text-blue-600">{result.correctAnswerStats.chosenByLower}</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded border border-green-200 text-center">
                              <p className="text-xs font-bold text-green-700 mb-1">Total</p>
                              <p className="text-sm font-bold text-green-600 leading-tight">{result.correctAnswerStats.total} <span className="text-xs">({result.correctAnswerStats.percentage}%)</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Distraktor Section */}
                        {result.distractors && result.distractors.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1">
                              <span className="inline-flex items-center justify-center w-3 h-3 rounded-sm bg-red-500 text-white text-xs flex-shrink-0">✕</span>
                              Distraktor
                            </h4>
                            <div className="space-y-2">
                              {result.distractors.map((distractor: any, didx: number) => (
                                <div key={didx} className="page-break-avoid bg-white rounded border border-slate-300 overflow-hidden">
                                  {/* Header Horizontal */}
                                  <div className="px-2 py-1.5 bg-slate-50 border-b border-slate-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-slate-900 flex-shrink-0">Opsi {distractor.option}:</span>
                                      <span className="text-xs font-bold text-slate-700 flex-shrink-0">{distractor.totalChosen}</span>
                                      <span className="text-xs text-slate-500 flex-shrink-0">({distractor.percentage}%)</span>
                                      <div className="ml-auto flex-shrink-0">
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${
                                          distractor.effectiveness === 'Efektif' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-amber-100 text-amber-700'
                                        }`}>
                                          {distractor.effectiveness === 'Efektif' ? '✓' : '⚠'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Content Horizontal */}
                                  <div className="p-2">
                                    <div className="flex gap-2 mb-2">
                                      {/* Peserta Atas */}
                                      <div className="flex-1 bg-orange-50 rounded p-1.5 border border-orange-200">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-bold text-orange-900">Atas</span>
                                          <span className="text-xs font-bold text-orange-600">{distractor.chosenByUpper}</span>
                                        </div>
                                        <div className="h-1.5 bg-orange-200 rounded-sm overflow-hidden">
                                          <div 
                                            className="h-full bg-orange-500"
                                            style={{ width: `${(distractor.chosenByUpper / Math.max(distractor.chosenByUpper, distractor.chosenByLower, 1)) * 100}%` || '0%' }}
                                          />
                                        </div>
                                      </div>
                                      
                                      {/* Peserta Bawah */}
                                      <div className="flex-1 bg-blue-50 rounded p-1.5 border border-blue-200">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-bold text-blue-900">Bawah</span>
                                          <span className="text-xs font-bold text-blue-600">{distractor.chosenByLower}</span>
                                        </div>
                                        <div className="h-1.5 bg-blue-200 rounded-sm overflow-hidden">
                                          <div 
                                            className="h-full bg-blue-500"
                                            style={{ width: `${(distractor.chosenByLower / Math.max(distractor.chosenByUpper, distractor.chosenByLower, 1)) * 100}%` || '0%' }}
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Analisis */}
                                    <div className="bg-amber-50 rounded p-1.5 border-l-2 border-amber-400">
                                      <p className="text-xs text-slate-800 leading-relaxed">
                                        <span className="font-bold text-amber-800">Analisis:</span> {distractor.reason}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              {groupedStudents && groupedStudents.map((group, groupIdx) => (
                <div key={group.class} className="px-3 py-3" style={{ marginTop: '0', marginBottom: '0', pageBreakBefore: 'always', pageBreakInside: 'avoid', pageBreakAfter: 'avoid', minHeight: '100vh' }}>
                  {groupIdx === 0 && (
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem', pageBreakAfter: 'avoid' }}>
                      📋 Rekapan Hasil Siswa
                    </h3>
                  )}
                  <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', marginBottom: '0.5rem', paddingBottom: '0.2rem', borderBottom: '1px solid #0284c7', pageBreakAfter: 'avoid' }}>
                    Kelas: {group.class}
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                          <th style={{ padding: '0.3rem 0.2rem', textAlign: 'center', fontWeight: '700', color: '#111827', width: '25px', fontSize: '0.6rem' }}>No</th>
                          <th style={{ padding: '0.3rem 0.3rem', textAlign: 'left', fontWeight: '700', color: '#111827', fontSize: '0.6rem' }}>Nama</th>
                          <th style={{ padding: '0.3rem 0.2rem', textAlign: 'center', fontWeight: '700', color: '#111827', width: '35px', fontSize: '0.6rem' }}>Benar</th>
                          <th style={{ padding: '0.3rem 0.2rem', textAlign: 'center', fontWeight: '700', color: '#111827', width: '35px', fontSize: '0.6rem' }}>Salah</th>
                          <th style={{ padding: '0.3rem 0.2rem', textAlign: 'center', fontWeight: '700', color: '#111827', width: '35px', fontSize: '0.6rem' }}>Total</th>
                          <th style={{ padding: '0.3rem 0.2rem', textAlign: 'center', fontWeight: '700', color: '#111827', width: '35px', fontSize: '0.6rem' }}>Skor</th>
                          <th style={{ padding: '0.3rem 0.2rem', textAlign: 'center', fontWeight: '700', color: '#111827', width: '40px', fontSize: '0.6rem' }}>%</th>
                          <th style={{ padding: '0.3rem 0.2rem', textAlign: 'center', fontWeight: '700', color: '#111827', width: '65px', fontSize: '0.6rem' }}>Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.students.map((student: any, idx: number) => {
                          const kkm = parseFloat(testInfo.kkm) || 75;
                          // Parse percentage (remove % sign if exists)
                          const percentageStr = String(student.percentage || '0').replace('%', '');
                          const percentage = parseFloat(percentageStr) || 0;
                          const isTuntas = percentage >= kkm;
                          
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', color: '#111827', fontSize: '0.65rem' }}>{idx + 1}</td>
                              <td style={{ padding: '0.3rem 0.3rem', color: '#111827', fontWeight: '500', fontSize: '0.65rem' }}>{student.name}</td>
                              <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', color: '#15803d', fontWeight: '600', fontSize: '0.65rem' }}>{student.correct}</td>
                              <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', color: '#dc2626', fontWeight: '600', fontSize: '0.65rem' }}>{student.incorrect}</td>
                              <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', color: '#111827', fontWeight: '600', fontSize: '0.65rem' }}>{student.total}</td>
                              <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', color: '#0284c7', fontWeight: '600', fontSize: '0.65rem' }}>{student.score}</td>
                              <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', color: '#0369a1', fontWeight: '700', fontSize: '0.65rem' }}>{student.percentage}</td>
                              <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', fontWeight: '700', fontSize: '0.6rem', color: isTuntas ? '#15803d' : '#dc2626', whiteSpace: 'nowrap' }}>
                                {isTuntas ? 'Tuntas' : 'Blm Tuntas'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                  </table>
                </div>
              ))}

                <div className="page-break-avoid px-3 py-3" style={{ marginTop: '1.5rem', padding: '1rem', backgroundImage: 'linear-gradient(to right, #f0f9ff, #e0f2fe)', borderRadius: '0.5rem', border: '1px solid #bfdbfe', pageBreakInside: 'avoid' }}>
                  <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.75rem', fontSize: '0.9rem' }}>📌 Panduan Interpretasi</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', fontSize: '0.75rem', color: '#4b5563' }}>
                    <div>
                      <p style={{ fontWeight: '600', color: '#111827', marginBottom: '0.35rem', fontSize: '0.8rem' }}>1. Kesukaran (P)</p>
                      <ul style={{ listStylePosition: 'inside', fontSize: '0.7rem', margin: '0', paddingLeft: '0', lineHeight: '1.4' }}>
                        <li>≥ 0.7: Mudah</li>
                        <li>0.3-0.7: Sedang ✓</li>
                        <li>&lt; 0.3: Sukar</li>
                      </ul>
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', color: '#111827', marginBottom: '0.35rem', fontSize: '0.8rem' }}>2. Pembeda (D)</p>
                      <ul style={{ listStylePosition: 'inside', fontSize: '0.7rem', margin: '0', paddingLeft: '0', lineHeight: '1.4' }}>
                        <li>≥ 0.4: Sangat Baik ✓</li>
                        <li>0.3-0.4: Baik ✓</li>
                        <li>&lt; 0.2: Jelek</li>
                      </ul>
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', color: '#111827', marginBottom: '0.35rem', fontSize: '0.8rem' }}>3. Distraktor</p>
                      <ul style={{ listStylePosition: 'inside', fontSize: '0.7rem', margin: '0', paddingLeft: '0', lineHeight: '1.4' }}>
                        <li>Efektif ✓: Bawah &gt; Atas</li>
                        <li>K. Efektif: Atas &gt; Bawah</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </>
        )}
      </div>
    </div>
  );
}