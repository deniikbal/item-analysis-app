'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Upload, Loader, Download, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';

interface ConversionMapping {
  questionNumber: number;
  mapping: { [text: string]: string };
}

export default function ConvertPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [mappings, setMappings] = useState<ConversionMapping[] | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
      setError(null);
      setConvertedFileUrl(null);
      setMappings(null);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError('Silakan pilih file Excel untuk diunggah.');
      return;
    }

    setLoading(true);
    setError(null);
    setConvertedFileUrl(null);
    setMappings(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengkonversi file.');
      }

      // Get conversion mappings from response header
      const mappingsHeader = response.headers.get('X-Conversion-Mappings');
      if (mappingsHeader) {
        setMappings(JSON.parse(mappingsHeader));
      }

      // Create blob from response and generate download URL
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setConvertedFileUrl(url);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan yang tidak terduga.');
      console.error('Conversion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (convertedFileUrl) {
      const link = document.createElement('a');
      link.href = convertedFileUrl;
      link.download = 'converted-answers.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Link>
            <Link href="/analyze-simple" className="text-sm text-blue-600 hover:text-blue-800">
              Simple View →
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">Konversi Jawaban Teks ke ABCDE</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Upload file Excel dengan jawaban berbentuk teks untuk dikonversi ke format ABCDE
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload File Excel
            </CardTitle>
            <CardDescription>
              Format Excel: Kolom 1 (Nama), Kolom 2 (Kelas), Kolom 3-N (Jawaban). Header kolom 3-N berisi kunci jawaban.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  onClick={handleConvert}
                  disabled={!selectedFile || loading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Konversi
                    </>
                  )}
                </Button>
              </div>

              {selectedFile && (
                <div className="text-sm text-gray-600">
                  File dipilih: <span className="font-medium">{selectedFile.name}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Results */}
        {convertedFileUrl && mappings && (
          <div className="space-y-6">
            {/* Download Section */}
            <Card className="shadow-lg border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Download className="w-5 h-5" />
                  Konversi Berhasil!
                </CardTitle>
                <CardDescription className="text-green-700">
                  File Anda telah berhasil dikonversi. Klik tombol di bawah untuk mengunduh.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download File Hasil Konversi
                </Button>
              </CardContent>
            </Card>

            {/* Mapping Preview */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Detail Konversi per Soal</CardTitle>
                <CardDescription>
                  Berikut adalah mapping jawaban teks ke huruf untuk setiap soal (random assignment)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mappings.map((item) => (
                    <div key={item.questionNumber} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-semibold text-lg mb-3 text-gray-800">
                        Soal {item.questionNumber}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(item.mapping).map(([textAnswer, letter]) => (
                          <div
                            key={textAnswer}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border"
                          >
                            <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                              {textAnswer}
                            </span>
                            <Badge className="bg-indigo-600 text-white font-bold">
                              {letter}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Info Section */}
            <Card className="shadow-lg border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Catatan Penting:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Setiap jawaban unik pada setiap soal akan di-assign huruf secara random</li>
                      <li>Kunci jawaban dan jawaban siswa menggunakan mapping yang sama</li>
                      <li>Jumlah opsi (huruf) disesuaikan dengan jumlah jawaban unik yang ada</li>
                      <li>File hasil dapat langsung digunakan untuk analisis di halaman utama</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
