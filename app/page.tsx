'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, FileSpreadsheet, Users, TrendingUp, CheckCircle2, Upload } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ANABUT</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-700 hover:text-emerald-600">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Daftar Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-xl mb-8">
            <BarChart3 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Analisis Butir Soal
            <span className="block text-emerald-600 mt-2">Lebih Mudah & Cepat</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Platform modern untuk menganalisis hasil ulangan secara otomatis. Upload data, dapatkan analisis statistik lengkap, dan cetak laporan profesional dalam hitungan menit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6 shadow-lg">
                Mulai Sekarang
                <CheckCircle2 className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-lg text-gray-600">
              Semua yang Anda butuhkan untuk analisis butir soal yang komprehensif
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg mb-4">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Excel Mudah</h3>
                <p className="text-gray-600">
                  Upload file Excel jawaban siswa dengan format yang fleksibel. Sistem akan otomatis mendeteksi dan memproses data.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Analisis Statistik Lengkap</h3>
                <p className="text-gray-600">
                  Dapatkan analisis mendalam dengan tingkat kesukaran, daya pembeda, validitas, dan reliabilitas soal secara otomatis.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Data Siswa Terorganisir</h3>
                <p className="text-gray-600">
                  Lihat data lengkap setiap siswa termasuk jawaban, skor, nilai, dan keterangan lulus/tidak lulus dengan tampilan yang rapi.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg mb-4">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cetak Laporan PDF</h3>
                <p className="text-gray-600">
                  Export hasil analisis ke format PDF yang profesional dan siap untuk dilaporkan kepada kepala sekolah.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Visualisasi Data</h3>
                <p className="text-gray-600">
                  Tampilan data yang modern dan mudah dipahami dengan tabel interaktif dan statistik visual yang informatif.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg mb-4">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Proses Otomatis</h3>
                <p className="text-gray-600">
                  Konversi jawaban teks ke huruf, perhitungan skor, dan analisis statistik berjalan otomatis tanpa input manual.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Siap Memulai Analisis?
              </h2>
              <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                Bergabunglah dengan guru-guru yang sudah menggunakan ANABUT untuk menganalisis hasil ulangan dengan lebih efisien.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-10 py-6 shadow-xl">
                  Daftar Gratis Sekarang
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p className="font-semibold text-gray-900 mb-2">ANABUT</p>
            <p className="text-sm">© 2024 Analisis Butir Soal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
