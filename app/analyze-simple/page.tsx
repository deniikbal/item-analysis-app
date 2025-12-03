'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Upload, Loader, Download, ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface StudentData {
  no: number;
  nama: string;
  kelas: string;
  jenisKelamin: string;
  rincianJawaban: string;
  jumlahBenar: number;
  jumlahSalah: number;
  skor: number;
  nilai: number;
  keterangan: string;
}

interface ConversionPreview {
  conversionMappings: { questionNumber: number; mapping: { [text: string]: string } }[];
  answerKeys: string;
  totalQuestions: number;
  totalOptions: number;
  studentsData: StudentData[];
  headers: {
    nama: string;
    kelas: string;
  };
}

interface OptionStat {
  option: string;
  propEndorsing: number;
  isKey: boolean;
}

interface ItemAnalysis {
  noItem: number;
  propCorrect: number;
  biser: number;
  pointBiser: number;
  options: OptionStat[];
  tingkatKesukaran: string;
  dayaBeda: string;
  efektivitasOption: string;
  statusSoal: string;
}

export default function AnalyzeSimplePage() {
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionPreview, setConversionPreview] = useState<ConversionPreview | null>(null);
  const [analysisData, setAnalysisData] = useState<ItemAnalysis[] | null>(null);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showPdfFormatDialog, setShowPdfFormatDialog] = useState(false);
  const [selectedPdfFormat, setSelectedPdfFormat] = useState<'a4' | 'f4'>('a4');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
      setError(null);
      setConversionPreview(null);
      setAnalysisData(null);
      setShowAnalysis(false);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError('Silakan pilih file Excel untuk dikonversi.');
      return;
    }

    setLoading(true);
    setError(null);
    setConversionPreview(null);
    setShowAnalysis(false);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/convert-preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengkonversi file.');
      }

      const data: ConversionPreview = await response.json();
      setConversionPreview(data);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan yang tidak terduga.');
      console.error('Conversion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!conversionPreview) return;

    const excelData: any[][] = [];
    
    const headerRow = [
      conversionPreview.headers.nama,
      conversionPreview.headers.kelas,
      'Jawaban',
    ];
    
    for (let i = 1; i <= conversionPreview.totalQuestions; i++) {
      headerRow.push(conversionPreview.answerKeys[i - 1]);
    }
    headerRow.push('Total Betul');
    excelData.push(headerRow);
    
    conversionPreview.studentsData.forEach(student => {
      const row = [
        student.nama,
        student.kelas,
        student.rincianJawaban,
      ];
      
      for (let i = 0; i < student.rincianJawaban.length; i++) {
        row.push(student.rincianJawaban[i]);
      }
      row.push(String(student.jumlahBenar));
      excelData.push(row);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Converted');
    
    XLSX.writeFile(wb, 'converted-answers.xlsx');
  };

  const handleAnalyze = async () => {
    if (!conversionPreview) {
      setError('Tidak ada data konversi untuk dianalisis.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisData(null);

    const excelData: any[][] = [];
    
    const headerRow = [
      conversionPreview.headers.nama,
      conversionPreview.headers.kelas,
    ];
    for (let i = 0; i < conversionPreview.totalQuestions; i++) {
      headerRow.push(conversionPreview.answerKeys[i]);
    }
    excelData.push(headerRow);
    
    conversionPreview.studentsData.forEach(student => {
      const row = [student.nama, student.kelas];
      for (let i = 0; i < student.rincianJawaban.length; i++) {
        row.push(student.rincianJawaban[i]);
      }
      excelData.push(row);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const file = new File([blob], 'temp.xlsx');
    
    const formData = new FormData();
    formData.append('file', file);

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
      
      const transformedData: ItemAnalysis[] = data.analysis.map((item: any, index: number) => {
        const pointBiser = parseFloat(item.discrimination);
        
        const options: OptionStat[] = [];
        const allOptions = ['A', 'B', 'C', 'D', 'E'];
        
        allOptions.forEach(opt => {
          const distractor = item.distractors.find((d: any) => d.option === opt);
          const isKey = item.correctAnswer.toUpperCase() === opt;
          
          let propEndorsing = 0;
          if (isKey) {
            propEndorsing = parseFloat(item.correctAnswerStats.percentage) / 100;
          } else if (distractor) {
            propEndorsing = parseFloat(distractor.percentage) / 100;
          }
          
          options.push({
            option: opt,
            propEndorsing,
            isKey,
          });
        });

        const dayaBedaValue = parseFloat(item.discrimination);
        const tingkatKesukaranValue = parseFloat(item.difficulty);
        
        let statusSoal = 'Soal sebelum a Direvisi';
        if (dayaBedaValue >= 0.3 && tingkatKesukaranValue >= 0.3 && tingkatKesukaranValue <= 0.7) {
          statusSoal = 'Soal sebelum';
        } else if (dayaBedaValue < 0.2 || tingkatKesukaranValue < 0.25 || tingkatKesukaranValue > 0.8) {
          statusSoal = 'Soal sebelum a Direvisi';
        }

        const effectiveDistractors = item.distractors.filter((d: any) => 
          d.effectiveness === 'Efektif'
        ).length;
        const efektivitasOption = effectiveDistractors >= 2 
          ? 'Ada Option lain yang bekerja lebih baik' 
          : 'Dapat Membedakan';

        return {
          noItem: index + 1,
          propCorrect: parseFloat(item.difficulty),
          biser: dayaBedaValue,
          pointBiser,
          options,
          tingkatKesukaran: item.difficultyInterpretation,
          dayaBeda: item.discriminationInterpretation,
          efektivitasOption,
          statusSoal,
        };
      });

      setAnalysisData(transformedData);
      setTotalStudents(data.summary.totalStudents);
      setShowAnalysis(true);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan yang tidak terduga.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (students: StudentData[]) => {
    if (!students || students.length === 0) return null;

    const scores = students.map(s => s.skor || 0);
    const percentages = students.map(s => s.nilai || 0);

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const mean = (arr: number[]) => sum(arr) / arr.length;
    const stdDev = (arr: number[]) => {
      const avg = mean(arr);
      const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
      return Math.sqrt(mean(squareDiffs));
    };

    return {
      totalScores: sum(scores),
      totalPercentages: sum(percentages),
      minScore: Math.min(...scores),
      minPercentage: Math.min(...percentages),
      maxScore: Math.max(...scores),
      maxPercentage: Math.max(...percentages),
      avgScore: mean(scores),
      avgPercentage: mean(percentages),
      stdDevScore: stdDev(scores),
      stdDevPercentage: stdDev(percentages),
    };
  };

  const handleDownloadPDF = async (format: 'a4' | 'f4' = 'a4') => {
    if (!conversionPreview || !analysisData) return;

    setLoading(true);
    setShowPdfFormatDialog(false);

    try {
      // F4: 215mm x 330mm, A4: 210mm x 297mm
      const pageFormat = format === 'f4' ? [215, 330] : 'a4';
      
      const doc: any = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: pageFormat,
      });

      let yPosition = 15;

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 215, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ANALISIS HASIL ULANGAN', 107.5, 12, { align: 'center' });
      doc.setFontSize(10);
      doc.text('TIPE SOAL: PILIHAN GANDA', 107.5, 19, { align: 'center' });

      yPosition = 30;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      // Test Information
      const testInfoData = [
        ['NAMA SEKOLAH', testInfo.schoolName || '-', 'TAHUN PELAJARAN', testInfo.academicYear || '-'],
        ['MATA PELAJARAN', testInfo.subject || '-', 'TANGGAL TES', testInfo.testDate || '-'],
        ['KELAS/SEMESTER', testInfo.classInfo || '-', 'KOMPETENSI DASAR', testInfo.competencyBasis || '-'],
        ['NAMA TES', testInfo.testName || '-', 'KKM', testInfo.kkm || '75'],
        ['NAMA PENGAJAR', testInfo.teacherName || '-', 'JUMLAH SOAL', conversionPreview.totalQuestions.toString()],
        ['NIP PENGAJAR', testInfo.teacherNip || '-', 'JUMLAH OPTION', conversionPreview.totalOptions.toString()],
        ['NAMA KEPALA SEKOLAH', testInfo.principalName || '-', 'JUMLAH SISWA', totalStudents.toString()],
        ['NIP KEPALA SEKOLAH', testInfo.principalNip || '-', 'KUNCI JAWABAN', conversionPreview.answerKeys],
      ];

      autoTable(doc, {
        startY: yPosition,
        body: testInfoData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 43 },
          1: { cellWidth: 54 },
          2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 41 },
          3: { cellWidth: 54 },
        },
        margin: { left: 10, right: 10 },
      });

      yPosition = doc.lastAutoTable.finalY + 8;

      // Student Data Table
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('DATA SISWA', 10, yPosition);
      yPosition += 5;

      const studentData = conversionPreview.studentsData.map((student) => [
        student.no.toString(),
        student.nama.substring(0, 25),
        student.jenisKelamin || '-',
        student.rincianJawaban.substring(0, 40),
        student.jumlahBenar.toString(),
        student.jumlahSalah.toString(),
        student.skor.toString(),
        student.nilai.toString(),
        student.keterangan.substring(0, 15),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [
          ['No.', 'Nama', 'L/P', 'Rincian Jawaban', 'Benar', 'Salah', 'Skor', 'Nilai', 'Ket.']
        ],
        body: studentData,
        theme: 'grid',
        styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak', halign: 'center' },
        headStyles: { fillColor: [251, 146, 60], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40, halign: 'left' },
          2: { cellWidth: 9 },
          3: { cellWidth: 62, halign: 'left', fontSize: 5 },
          4: { cellWidth: 11 },
          5: { cellWidth: 11 },
          6: { cellWidth: 11 },
          7: { cellWidth: 11 },
          8: { cellWidth: 27, fontSize: 5 },
        },
        margin: { left: 10, right: 10 },
      });

      yPosition = doc.lastAutoTable.finalY + 8;

      // Analysis Statistics Table
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('STATISTIK ANALISIS BUTIR', 10, yPosition);
      yPosition += 5;

      const analysisTableData: any[] = [];
      analysisData.forEach((item, idx) => {
        item.options.forEach((opt, optIdx) => {
          if (optIdx === 0) {
            analysisTableData.push([
              (idx + 1).toString(),
              item.propCorrect.toFixed(3),
              item.biser.toFixed(3),
              item.pointBiser.toFixed(3),
              opt.option,
              opt.propEndorsing.toFixed(3),
              opt.isKey ? '★' : '',
              item.tingkatKesukaran.substring(0, 15),
              item.dayaBeda.substring(0, 15),
              item.efektivitasOption.substring(0, 20),
              item.statusSoal.substring(0, 15),
            ]);
          } else {
            analysisTableData.push([
              '', '', '', '',
              opt.option,
              opt.propEndorsing.toFixed(3),
              opt.isKey ? '★' : '',
              '', '', '', ''
            ]);
          }
        });
      });

      autoTable(doc, {
        startY: yPosition,
        head: [[
          { content: 'No.', rowSpan: 2, styles: { lineWidth: 0.1, lineColor: [0, 0, 0] } },
          { content: 'Statistics Item', colSpan: 3, styles: { lineWidth: 0.1, lineColor: [0, 0, 0] } },
          { content: 'Statistics Option', colSpan: 3, styles: { lineWidth: 0.1, lineColor: [0, 0, 0] } },
          { content: 'Tafsiran', colSpan: 4, styles: { lineWidth: 0.1, lineColor: [0, 0, 0] } },
        ], [
          'Prop.Cor', 'Biser', 'Pt.Biser',
          'Opt', 'Prop.End', 'Key',
          'T.Kesukaran', 'D.Beda', 'Efek.Opt', 'Status'
        ]],
        body: analysisTableData,
        theme: 'grid',
        styles: { 
          fontSize: 5, 
          cellPadding: 1, 
          overflow: 'linebreak', 
          halign: 'center',
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        headStyles: { 
          fillColor: [147, 197, 253], 
          textColor: 0, 
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 16 },
          2: { cellWidth: 14 },
          3: { cellWidth: 16 },
          4: { cellWidth: 10 },
          5: { cellWidth: 16 },
          6: { cellWidth: 10, fillColor: [255, 250, 205], fontStyle: 'bold', fontSize: 7 },
          7: { cellWidth: 25, fontSize: 4.5 },
          8: { cellWidth: 25, fontSize: 4.5 },
          9: { cellWidth: 27, fontSize: 4.5 },
          10: { cellWidth: 23, fontSize: 4.5 },
        },
        margin: { left: 10, right: 10 },
        didDrawCell: function(data: any) {
          // Highlight key answers with background color
          if (data.column.index === 6 && data.cell.raw === '★') {
            doc.setFillColor(255, 215, 0); // Gold color
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('★', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
          }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // Add statistics table
      const stats = calculateStatistics(conversionPreview.studentsData);
      
      if (stats) {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 15;
        }

        // Title for statistics
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('STATISTIK ANALISIS BUTIR', 10, yPosition);
        yPosition += 7;

        const statisticsData = [
          ['JUMLAH :', stats.totalScores.toFixed(0), stats.totalPercentages.toFixed(2)],
          ['TERKECIL :', stats.minScore.toFixed(2), stats.minPercentage.toFixed(2)],
          ['TERBESAR :', stats.maxScore.toFixed(2), stats.maxPercentage.toFixed(2)],
          ['RATA-RATA :', stats.avgScore.toFixed(3), stats.avgPercentage.toFixed(3)],
          ['SIMPANGAN BAKU :', stats.stdDevScore.toFixed(3), stats.stdDevPercentage.toFixed(3)],
        ];

        autoTable(doc, {
          startY: yPosition,
          body: statisticsData,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 72, halign: 'right' },
            1: { cellWidth: 60, halign: 'center', fontStyle: 'bold' },
            2: { cellWidth: 60, halign: 'center', fontStyle: 'bold' },
          },
          margin: { left: 11.5, right: 11.5 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Add signature section (always show)
      if (yPosition > 270 || !stats) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      // Date and location (right side)
      const today = new Date();
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const dateStr = `Bantarujeg, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
      const rightMargin = 11.5 + 192; // margin left + table width
      doc.text(dateStr, rightMargin, yPosition, { align: 'right' });

      yPosition += 7;

      // Left signature: Kepala Sekolah
      const leftMargin = 11.5;
      doc.text('Mengetahui,', leftMargin + 5, yPosition);
      doc.text('Guru Mata Pelajaran', rightMargin - 5, yPosition, { align: 'right' });
      
      yPosition += 5;
      doc.text('Kepala Sekolah', leftMargin + 5, yPosition);

      yPosition += 20; // Space for signature

      // Names and NIP
      doc.setFont('helvetica', 'bold');
      doc.text(testInfo.principalName || 'Dr. H. Toto Warsito, S.Ag., M.Ag', leftMargin + 5, yPosition);
      doc.text(testInfo.teacherName || 'REVI INDIKA, S.Pd., Gr.', rightMargin - 5, yPosition, { align: 'right' });
      
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`NIP ${testInfo.principalNip || '197303021998021002'}`, leftMargin + 5, yPosition);
      doc.text(`NIP ${testInfo.teacherNip || '199404416202412033'}`, rightMargin - 5, yPosition, { align: 'right' });

      const filename = `Analisis-${testInfo.testName || 'Ulangan'}-${testInfo.classInfo || ''}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStyledExcel = () => {
    if (!conversionPreview || !analysisData) return;

    setLoading(true);

    try {
      const wb = XLSX.utils.book_new();
      const ws: any = {};

      // Helper function to set cell value and style
      const setCell = (ref: string, value: any, style?: any) => {
        ws[ref] = { v: value, t: typeof value === 'number' ? 'n' : 's', s: style };
      };

      let currentRow = 0;

      // Title Section
      setCell(`A${currentRow + 1}`, 'ANALISIS HASIL ULANGAN', {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2563EB" } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      ws['!merges'] = [{ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 8 } }];
      currentRow++;

      setCell(`A${currentRow + 1}`, 'TIPE SOAL : PILIHAN GANDA', {
        font: { bold: true },
        fill: { fgColor: { rgb: "DBEAFE" } },
        alignment: { horizontal: 'center' }
      });
      ws['!merges'].push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 8 } });
      currentRow += 2;

      // Test Info Section
      const testInfoData = [
        ['NAMA SEKOLAH', ':', testInfo.schoolName || '-', 'TAHUN PELAJARAN', ':', testInfo.academicYear || '-'],
        ['MATA PELAJARAN', ':', testInfo.subject || '-', 'TANGGAL TES', ':', testInfo.testDate || '-'],
        ['KELAS/SEMESTER', ':', testInfo.classInfo || '-', 'NAMA TES', ':', testInfo.testName || '-'],
        ['KOMPETENSI DASAR', ':', testInfo.competencyBasis || '-', '', '', ''],
        ['NAMA PENGAJAR', ':', testInfo.teacherName || '-', '', '', ''],
      ];

      testInfoData.forEach((row) => {
        row.forEach((cell, idx) => {
          const colLetter = String.fromCharCode(65 + idx);
          setCell(`${colLetter}${currentRow + 1}`, cell, {
            font: { bold: idx === 0 || idx === 3 }
          });
        });
        currentRow++;
      });
      currentRow++;

      // Data Soal Section
      setCell(`A${currentRow + 1}`, 'DATA SOAL PILIHAN GANDA', {
        font: { bold: true },
        fill: { fgColor: { rgb: "FED7AA" } },
        alignment: { horizontal: 'center' }
      });
      ws['!merges'].push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 3 } });

      setCell(`E${currentRow + 1}`, 'RINCIAN KUNCI JAWABAN', {
        font: { bold: true },
        fill: { fgColor: { rgb: "FED7AA" } },
        alignment: { horizontal: 'center' }
      });
      ws['!merges'].push({ s: { r: currentRow, c: 4 }, e: { r: currentRow, c: 8 } });
      currentRow++;

      const dataSoal = [
        ['JUMLAH SOAL', ':', conversionPreview.totalQuestions],
        ['JUMLAH OPTION', ':', conversionPreview.totalOptions],
        ['SKOR BENAR', ':', '1'],
        ['SKOR SALAH', ':', '0'],
        ['SKALA NILAI', ':', '100'],
      ];

      const startRow = currentRow;
      dataSoal.forEach((row, idx) => {
        setCell(`A${currentRow + 1}`, row[0]);
        setCell(`B${currentRow + 1}`, row[1]);
        setCell(`C${currentRow + 1}`, row[2]);
        currentRow++;
      });

      // Kunci Jawaban
      const keyAnswerRow = startRow;
      setCell(`E${keyAnswerRow + 1}`, conversionPreview.answerKeys, {
        font: { bold: true, sz: 12, color: { rgb: "1D4ED8" } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      });
      ws['!merges'].push({ s: { r: keyAnswerRow, c: 4 }, e: { r: currentRow - 1, c: 8 } });
      currentRow++;

      // Student Data Table Header
      const studentHeaders = ['No.', 'Nama', 'L/P', 'RINCIAN JAWABAN SISWA', 'BENAR', 'SALAH', 'SKOR', 'NILAI', 'KET.'];
      studentHeaders.forEach((header, idx) => {
        const colLetter = String.fromCharCode(65 + idx);
        setCell(`${colLetter}${currentRow + 1}`, header, {
          font: { bold: true },
          fill: { fgColor: { rgb: "FED7AA" } },
          alignment: { horizontal: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        });
      });
      currentRow++;

      // Student Data Rows
      conversionPreview.studentsData.forEach((student) => {
        setCell(`A${currentRow + 1}`, student.no, { alignment: { horizontal: 'center' } });
        setCell(`B${currentRow + 1}`, student.nama);
        setCell(`C${currentRow + 1}`, student.jenisKelamin || '-', { alignment: { horizontal: 'center' } });
        setCell(`D${currentRow + 1}`, student.rincianJawaban, { font: { name: 'Courier New' } });
        setCell(`E${currentRow + 1}`, student.jumlahBenar, { 
          alignment: { horizontal: 'center' },
          font: { color: { rgb: "15803D" } }
        });
        setCell(`F${currentRow + 1}`, student.jumlahSalah, { 
          alignment: { horizontal: 'center' },
          font: { color: { rgb: "DC2626" } }
        });
        setCell(`G${currentRow + 1}`, student.skor, { alignment: { horizontal: 'center' } });
        setCell(`H${currentRow + 1}`, student.nilai, { alignment: { horizontal: 'center' }, font: { bold: true } });
        setCell(`I${currentRow + 1}`, student.keterangan, { alignment: { horizontal: 'center' } });
        currentRow++;
      });
      currentRow++;

      // Analysis Table Header
      setCell(`A${currentRow + 1}`, 'STATISTICS ITEM', {
        font: { bold: true },
        fill: { fgColor: { rgb: "DBEAFE" } },
        alignment: { horizontal: 'center' }
      });
      ws['!merges'].push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 4 } });
      
      setCell(`F${currentRow + 1}`, 'TAFSIRAN', {
        font: { bold: true },
        fill: { fgColor: { rgb: "DBEAFE" } },
        alignment: { horizontal: 'center' }
      });
      ws['!merges'].push({ s: { r: currentRow, c: 5 }, e: { r: currentRow, c: 8 } });
      currentRow++;

      const analysisHeaders = ['No.', 'No. Item', 'Prop. Correct', 'Biser', 'Point Biser', 'Tingkat Kesukaran', 'Daya Beda', 'Efektifitas Option', 'Status Soal'];
      analysisHeaders.forEach((header, idx) => {
        const colLetter = String.fromCharCode(65 + idx);
        setCell(`${colLetter}${currentRow + 1}`, header, {
          font: { bold: true, sz: 9 },
          fill: { fgColor: { rgb: "DBEAFE" } },
          alignment: { horizontal: 'center', wrapText: true },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        });
      });
      currentRow++;

      // Analysis Data Rows
      analysisData.forEach((item, idx) => {
        setCell(`A${currentRow + 1}`, idx + 1, { alignment: { horizontal: 'center' } });
        setCell(`B${currentRow + 1}`, item.noItem, { alignment: { horizontal: 'center' } });
        setCell(`C${currentRow + 1}`, item.propCorrect.toFixed(3), { alignment: { horizontal: 'center' } });
        setCell(`D${currentRow + 1}`, item.biser.toFixed(3), { alignment: { horizontal: 'center' } });
        setCell(`E${currentRow + 1}`, item.pointBiser.toFixed(3), { alignment: { horizontal: 'center' } });
        setCell(`F${currentRow + 1}`, item.tingkatKesukaran, { alignment: { horizontal: 'left' }, font: { sz: 9 } });
        setCell(`G${currentRow + 1}`, item.dayaBeda, { alignment: { horizontal: 'left' }, font: { sz: 9 } });
        setCell(`H${currentRow + 1}`, item.efektivitasOption, { alignment: { horizontal: 'left' }, font: { sz: 9 } });
        setCell(`I${currentRow + 1}`, item.statusSoal, { alignment: { horizontal: 'left' }, font: { sz: 9 } });
        currentRow++;
      });
      currentRow++;

      // Summary Statistics
      const scores = conversionPreview.studentsData.map(s => s.skor);
      const values = conversionPreview.studentsData.map(s => s.nilai);
      const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const meanValue = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDevScore = Math.sqrt(scores.reduce((sum, val) => sum + Math.pow(val - meanScore, 2), 0) / scores.length);
      const stdDevValue = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - meanValue, 2), 0) / values.length);

      const summaryData = [
        ['JUMLAH :', scores.reduce((a, b) => a + b, 0), values.reduce((a, b) => a + b, 0)],
        ['TERKECIL :', Math.min(...scores).toFixed(2), Math.min(...values).toFixed(2)],
        ['TERBESAR :', Math.max(...scores).toFixed(2), Math.max(...values).toFixed(2)],
        ['RATA-RATA :', meanScore.toFixed(3), meanValue.toFixed(3)],
        ['SIMPANGAN BAKU :', stdDevScore.toFixed(3), stdDevValue.toFixed(3)],
      ];

      summaryData.forEach((row) => {
        setCell(`A${currentRow + 1}`, row[0], { font: { bold: true }, alignment: { horizontal: 'right' } });
        setCell(`B${currentRow + 1}`, row[1], { alignment: { horizontal: 'center' } });
        setCell(`C${currentRow + 1}`, row[2], { alignment: { horizontal: 'center' } });
        currentRow++;
      });
      currentRow += 2;

      // Signature Section
      setCell(`A${currentRow + 1}`, `${testInfo.schoolName || 'Bantarujeg'}, ${testInfo.testDate || '17 Juni 2025'}`, {
        alignment: { horizontal: 'right' }
      });
      ws['!merges'].push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 8 } });
      currentRow += 2;

      setCell(`A${currentRow + 1}`, 'Mengetahui,', { alignment: { horizontal: 'center' } });
      setCell(`E${currentRow + 1}`, 'Guru Mata Pelajaran', { alignment: { horizontal: 'center' } });
      currentRow++;

      setCell(`A${currentRow + 1}`, 'Kepala Sekolah', { font: { bold: true }, alignment: { horizontal: 'center' } });
      currentRow += 4;

      setCell(`A${currentRow + 1}`, testInfo.principalName || 'Dr. H. Toto Warsito, S.Ag., M.Ag', {
        font: { bold: true, underline: true },
        alignment: { horizontal: 'center' }
      });
      setCell(`E${currentRow + 1}`, testInfo.teacherName || 'REVI INDIKA, S.Pd., Gr.', {
        font: { bold: true, underline: true },
        alignment: { horizontal: 'center' }
      });
      currentRow++;

      setCell(`A${currentRow + 1}`, `NIP ${testInfo.principalNip || '197303021998021002'}`, { alignment: { horizontal: 'center' } });
      setCell(`E${currentRow + 1}`, `NIP ${testInfo.teacherNip || '199404162024212033'}`, { alignment: { horizontal: 'center' } });

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },  // A - No
        { wch: 20 }, // B - Nama
        { wch: 5 },  // C - L/P
        { wch: 40 }, // D - Rincian Jawaban
        { wch: 10 }, // E - Benar
        { wch: 10 }, // F - Salah
        { wch: 8 },  // G - Skor
        { wch: 8 },  // H - Nilai
        { wch: 12 }, // I - Ket
      ];

      // Set row heights
      ws['!rows'] = [];
      for (let i = 0; i < currentRow + 1; i++) {
        ws['!rows'].push({ hpt: 20 });
      }

      // Calculate range
      ws['!ref'] = `A1:I${currentRow + 1}`;

      XLSX.utils.book_append_sheet(wb, ws, 'Analisis');
      XLSX.writeFile(wb, `Analisis-${testInfo.testName || 'Ulangan'}-${testInfo.classInfo || ''}.xlsx`);

    } catch (error) {
      console.error('Error generating Excel:', error);
      setError('Gagal membuat Excel. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Analisis Item - Simple View</h1>
              <p className="text-sm text-gray-600">Konversi jawaban teks ke ABCDE dan analisis butir soal</p>
            </div>
          </div>
        </div>

        {/* Test Info Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Data Ulangan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'schoolName', label: 'Nama Sekolah', placeholder: 'SMAN 1 BANTARUJEG' },
                { key: 'subject', label: 'Mata Pelajaran', placeholder: 'GEOGRAFI' },
                { key: 'classInfo', label: 'Kelas/Semester', placeholder: 'XI GBIM 1' },
                { key: 'testName', label: 'Nama Tes', placeholder: 'PSAT' },
                { key: 'competencyBasis', label: 'Kompetensi Dasar', placeholder: 'POTENSI SUMBER DAYA ALAM' },
                { key: 'teacherName', label: 'Nama Pengajar', placeholder: 'REVI INDIKA, S.Pd., Gr.' },
                { key: 'teacherNip', label: 'NIP Guru', placeholder: '199404162024212033' },
                { key: 'principalName', label: 'Nama Kepala Sekolah', placeholder: 'Dr. H. Toto Warsito, S.Ag., M.Ag' },
                { key: 'principalNip', label: 'NIP Kepala Sekolah', placeholder: '197303021998021002' },
                { key: 'academicYear', label: 'Tahun Pelajaran', placeholder: '2024/2025' },
                { key: 'testDate', label: 'Tanggal Tes', placeholder: '10 JUNI 2025' },
                { key: 'kkm', label: 'KKM', placeholder: '75' },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{field.label}</label>
                  <Input
                    type="text"
                    placeholder={field.placeholder}
                    value={testInfo[field.key as keyof TestInfo]}
                    onChange={(e) => setTestInfo({ ...testInfo, [field.key]: e.target.value })}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upload & Convert Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Upload & Konversi Excel</CardTitle>
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
                  className="bg-blue-600 hover:bg-blue-700"
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

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Preview */}
        {conversionPreview && !showAnalysis && (
          <div className="space-y-6">
            {/* Header Info Box */}
            <div className="bg-white rounded-lg shadow border-2 border-blue-300 overflow-hidden">
              <div className="bg-blue-600 text-white text-center py-3 font-bold text-lg">
                ANALISIS HASIL ULANGAN
              </div>
              <div className="bg-blue-100 text-center py-2 font-semibold">
                TIPE SOAL : PILIHAN GANDA
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
                  <div className="flex">
                    <span className="font-semibold w-48">NAMA SEKOLAH</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.schoolName || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">TAHUN PELAJARAN</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.academicYear || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">MATA PELAJARAN</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.subject || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">TANGGAL TES</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.testDate || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">KELAS/SEMESTER</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.classInfo || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">NAMA TES</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.testName || '-'}</span>
                  </div>
                  <div className="flex col-span-2">
                    <span className="font-semibold w-48">KOMPETENSI DASAR</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.competencyBasis || '-'}</span>
                  </div>
                  <div className="flex col-span-2">
                    <span className="font-semibold w-48">NAMA PENGAJAR</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.teacherName || '-'}</span>
                  </div>
                </div>

                {/* Data Soal Section */}
                <div className="border-t-2 border-blue-300 pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="font-bold text-center mb-3 text-orange-900">DATA SOAL PILIHAN GANDA</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-semibold">JUMLAH SOAL:</span>
                          <span className="font-bold text-orange-700">{conversionPreview.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">JUMLAH OPTION:</span>
                          <span className="font-bold text-orange-700">{conversionPreview.totalOptions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">SKOR BENAR:</span>
                          <span className="font-bold text-orange-700">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">SKOR SALAH:</span>
                          <span className="font-bold text-orange-700">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">SKALA NILAI:</span>
                          <span className="font-bold text-orange-700">100</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="font-bold text-center mb-3 text-orange-900">RINCIAN KUNCI JAWABAN</h3>
                      <div className="bg-white p-3 rounded border border-orange-300 text-center">
                        <p className="text-2xl font-bold text-blue-700 tracking-wider break-all">
                          {conversionPreview.answerKeys}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Data Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-orange-100 border-b-2 border-orange-300">
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">No.<br/>Urut</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">Nama</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">L/P</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">RINCIAN JAWABAN SISWA<br/>(Gunakan huruf kapital. contoh : AADE...)</th>
                    <th colSpan={2} className="border border-gray-300 px-3 py-2 text-center font-bold">JUMLAH</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">SKOR</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">NILAI</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">KET.</th>
                  </tr>
                  <tr className="bg-orange-50">
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">BENAR</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">SALAH</th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {conversionPreview.studentsData.map((student) => (
                    <tr key={student.no} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 text-center">{student.no}</td>
                      <td className="border border-gray-300 px-3 py-2">{student.nama}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{student.jenisKelamin || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 font-mono text-xs break-all">{student.rincianJawaban}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-semibold text-green-700">{student.jumlahBenar}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-semibold text-red-700">{student.jumlahSalah}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{student.skor}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-semibold">{student.nilai}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs">{student.keterangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={handleDownloadExcel}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Excel Jawaban
              </Button>
              <Button
                onClick={() => setShowPdfFormatDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading || !analysisData}
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                onClick={handleAnalyze}
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Lanjut ke Analisis Statistik
                  </>
                )}
              </Button>
            </div>

            {/* Conversion Mappings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detail Konversi per Soal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionPreview.conversionMappings.map((item) => (
                    <div key={item.questionNumber} className="border-b pb-3 last:border-b-0">
                      <h3 className="font-semibold text-sm mb-2">Soal {item.questionNumber}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {Object.entries(item.mapping).map(([text, letter]) => (
                          <div
                            key={text}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded border text-xs"
                          >
                            <span className="truncate flex-1 mr-2">{text}</span>
                            <span className="font-bold text-blue-600">{letter}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis Results Table */}
        {showAnalysis && analysisData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Hasil Analisis Statistik</h2>
              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadStyledExcel}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Excel
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowPdfFormatDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Wrapper for PDF export */}
            <div id="pdfContent" style={{ 
              fontSize: '12px !important', 
              lineHeight: '1.5',
              fontFamily: 'Arial, sans-serif'
            }}>
            <style>{`
              #pdfContent,
              #pdfContent * {
                font-size: 12px !important;
              }
              #pdfContent table,
              #pdfContent th,
              #pdfContent td,
              #pdfContent p,
              #pdfContent span,
              #pdfContent div,
              #pdfContent h1,
              #pdfContent h2,
              #pdfContent h3,
              #pdfContent h4,
              #pdfContent h5,
              #pdfContent h6 {
                font-size: 12px !important;
              }
              #pdfContent .text-xs,
              #pdfContent .text-sm,
              #pdfContent .text-base,
              #pdfContent .text-lg,
              #pdfContent .text-xl,
              #pdfContent .text-2xl,
              #pdfContent .text-3xl,
              #pdfContent .text-4xl {
                font-size: 12px !important;
              }
              /* Compact table styling */
              #pdfContent table th,
              #pdfContent table td {
                padding: 4px 6px !important;
                line-height: 1.3 !important;
                vertical-align: middle !important;
              }
              #pdfContent .px-3 {
                padding-left: 6px !important;
                padding-right: 6px !important;
              }
              #pdfContent .py-2 {
                padding-top: 4px !important;
                padding-bottom: 4px !important;
              }
              #pdfContent .px-4 {
                padding-left: 6px !important;
                padding-right: 6px !important;
              }
              #pdfContent .py-3 {
                padding-top: 4px !important;
                padding-bottom: 4px !important;
              }
              #pdfContent .p-3,
              #pdfContent .p-4,
              #pdfContent .p-6 {
                padding: 6px !important;
              }
              #pdfContent .mb-6,
              #pdfContent .mb-8 {
                margin-bottom: 8px !important;
              }
              #pdfContent .gap-8 {
                gap: 8px !important;
              }
              /* Column width adjustments - all text in single line */
              #pdfContent table tbody tr td,
              #pdfContent table thead tr th {
                white-space: nowrap !important;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              /* Column 1: No */
              #pdfContent table tbody tr td:nth-child(1) {
                min-width: 35px !important;
                max-width: 35px !important;
                text-align: center;
              }
              /* Column 2: Nama - wider for full names */
              #pdfContent table tbody tr td:nth-child(2) {
                min-width: 150px !important;
                max-width: 180px !important;
                font-size: 11px !important;
              }
              /* Column 3: L/P */
              #pdfContent table tbody tr td:nth-child(3) {
                min-width: 30px !important;
                max-width: 30px !important;
                text-align: center;
              }
              /* Column 4: Rincian Jawaban */
              #pdfContent table tbody tr td:nth-child(4) {
                font-family: 'Courier New', monospace !important;
                font-size: 10px !important;
                min-width: 200px !important;
              }
              /* Column 5-6: Benar/Salah */
              #pdfContent table tbody tr td:nth-child(5),
              #pdfContent table tbody tr td:nth-child(6) {
                min-width: 50px !important;
                max-width: 50px !important;
                text-align: center;
              }
              /* Column 7-8: Skor/Nilai */
              #pdfContent table tbody tr td:nth-child(7),
              #pdfContent table tbody tr td:nth-child(8) {
                min-width: 45px !important;
                max-width: 45px !important;
                text-align: center;
              }
              /* Column 9: Keterangan */
              #pdfContent table tbody tr td:nth-child(9),
              #pdfContent table tbody tr td:last-child {
                min-width: 90px !important;
                max-width: 90px !important;
                font-size: 11px !important;
                text-align: center;
              }
              
              /* Statistics Item Table - Ultra Compact styling */
              #pdfContent .bg-white.rounded-lg.shadow.overflow-x-auto:last-of-type table,
              #pdfContent > div:last-child table {
                width: 100% !important;
                table-layout: fixed !important;
              }
              #pdfContent .bg-white.rounded-lg.shadow.overflow-x-auto:last-of-type table *,
              #pdfContent > div:last-child table * {
                font-size: 8px !important;
                padding: 1px 2px !important;
                line-height: 1.1 !important;
              }
              /* Statistics columns - ultra compact */
              #pdfContent > div:last-child table tbody tr td:nth-child(1) {
                width: 2% !important;
                font-size: 8px !important;
              }
              #pdfContent > div:last-child table tbody tr td:nth-child(2) {
                width: 3% !important;
                font-size: 8px !important;
              }
              #pdfContent > div:last-child table tbody tr td:nth-child(3),
              #pdfContent > div:last-child table tbody tr td:nth-child(4),
              #pdfContent > div:last-child table tbody tr td:nth-child(5) {
                width: 5% !important;
                font-size: 8px !important;
              }
              #pdfContent > div:last-child table tbody tr td:nth-child(6) {
                width: 3% !important;
                font-size: 8px !important;
              }
              #pdfContent > div:last-child table tbody tr td:nth-child(7) {
                width: 5% !important;
                font-size: 8px !important;
              }
              #pdfContent > div:last-child table tbody tr td:nth-child(8) {
                width: 3% !important;
                font-size: 8px !important;
              }
              /* Tafsiran columns - more space, allow wrap */
              #pdfContent > div:last-child table tbody tr td:nth-child(9),
              #pdfContent > div:last-child table tbody tr td:nth-child(10),
              #pdfContent > div:last-child table tbody tr td:nth-child(11),
              #pdfContent > div:last-child table tbody tr td:nth-child(12) {
                width: 17.25% !important;
                font-size: 7px !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                white-space: normal !important;
                line-height: 1.2 !important;
                padding: 2px !important;
              }
              #pdfContent > div:last-child table thead tr th {
                font-size: 7px !important;
                padding: 2px 1px !important;
              }
            `}</style>
            
            {/* Header Info and Student Data - Show when analysis is displayed */}
            {conversionPreview && (
            <>
            <div className="bg-white rounded-lg shadow border-2 border-blue-300 overflow-hidden mb-6">
              <div className="bg-blue-600 text-white text-center py-3 font-bold text-lg">
                ANALISIS HASIL ULANGAN
              </div>
              <div className="bg-blue-100 text-center py-2 font-semibold">
                TIPE SOAL : PILIHAN GANDA
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
                  <div className="flex">
                    <span className="font-semibold w-48">NAMA SEKOLAH</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.schoolName || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">TAHUN PELAJARAN</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.academicYear || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">MATA PELAJARAN</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.subject || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">TANGGAL TES</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.testDate || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">KELAS/SEMESTER</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.classInfo || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-48">NAMA TES</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.testName || '-'}</span>
                  </div>
                  <div className="flex col-span-2">
                    <span className="font-semibold w-48">KOMPETENSI DASAR</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.competencyBasis || '-'}</span>
                  </div>
                  <div className="flex col-span-2">
                    <span className="font-semibold w-48">NAMA PENGAJAR</span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-700 font-semibold">{testInfo.teacherName || '-'}</span>
                  </div>
                </div>

                <div className="border-t-2 border-blue-300 pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="font-bold text-center mb-3 text-orange-900">DATA SOAL PILIHAN GANDA</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-semibold">JUMLAH SOAL:</span>
                          <span className="font-bold text-orange-700">{conversionPreview.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">JUMLAH OPTION:</span>
                          <span className="font-bold text-orange-700">{conversionPreview.totalOptions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">SKOR BENAR:</span>
                          <span className="font-bold text-orange-700">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">SKOR SALAH:</span>
                          <span className="font-bold text-orange-700">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">SKALA NILAI:</span>
                          <span className="font-bold text-orange-700">100</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="font-bold text-center mb-3 text-orange-900">RINCIAN KUNCI JAWABAN</h3>
                      <div className="bg-white p-3 rounded border border-orange-300 text-center">
                        <p className="text-2xl font-bold text-blue-700 tracking-wider break-all">
                          {conversionPreview.answerKeys}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Data Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-orange-100 border-b-2 border-orange-300">
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">No.<br/>Urut</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">Nama</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">L/P</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">RINCIAN JAWABAN SISWA</th>
                    <th colSpan={2} className="border border-gray-300 px-3 py-2 text-center font-bold">JUMLAH</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">SKOR</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">NILAI</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold">KET.</th>
                  </tr>
                  <tr className="bg-orange-50">
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">BENAR</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">SALAH</th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                    <th className="border border-gray-300 px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {conversionPreview.studentsData.map((student) => (
                    <tr key={student.no} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 text-center">{student.no}</td>
                      <td className="border border-gray-300 px-3 py-2">{student.nama}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{student.jenisKelamin || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 font-mono text-xs break-all">{student.rincianJawaban}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-semibold text-green-700">{student.jumlahBenar}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-semibold text-red-700">{student.jumlahSalah}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{student.skor}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-semibold">{student.nilai}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs">{student.keterangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
            )}

            {/* Analysis Statistics Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-center font-semibold">No.</th>
                    <th colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-semibold">Statistics Item</th>
                    <th colSpan={3} className="border border-gray-300 px-3 py-2 text-center font-semibold">Statistics Option</th>
                    <th colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-semibold">Tafsiran</th>
                  </tr>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-2 py-1 text-xs">No. Item</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Prop. Correct</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Biser</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Point Biser</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Opt.</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Prop. Endorsing</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Key</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Tingkat Kesukaran</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Daya Beda</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Efektifitas Option</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs">Status Soal</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.map((item, idx) => {
                    const rowSpan = item.options.length;
                    return item.options.map((opt, optIdx) => (
                      <tr key={`${idx}-${optIdx}`} className="hover:bg-gray-50">
                        {optIdx === 0 && (
                          <>
                            <td rowSpan={rowSpan} className="border border-gray-300 px-3 py-2 text-center font-medium">
                              {idx + 1}
                            </td>
                            <td rowSpan={rowSpan} className="border border-gray-300 px-3 py-2 text-center">
                              {item.noItem}
                            </td>
                            <td rowSpan={rowSpan} className="border border-gray-300 px-3 py-2 text-center">
                              {item.propCorrect.toFixed(3)}
                            </td>
                            <td rowSpan={rowSpan} className="border border-gray-300 px-3 py-2 text-center">
                              {item.biser.toFixed(3)}
                            </td>
                            <td rowSpan={rowSpan} className="border border-gray-300 px-3 py-2 text-center">
                              {item.pointBiser.toFixed(3)}
                            </td>
                          </>
                        )}
                        <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                          {opt.option}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {opt.propEndorsing.toFixed(3)}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {opt.isKey ? '⭐' : ''}
                        </td>
                        {optIdx === 0 && (
                          <>
                            <td rowSpan={rowSpan} className="border border-gray-300 px-2 py-2 text-xs">
                              {item.tingkatKesukaran}
                            </td>
                            <td rowSpan={rowSpan} className="border border-gray-300 px-2 py-2 text-xs">
                              {item.dayaBeda}
                            </td>
                            <td rowSpan={rowSpan} className="border border-gray-300 px-2 py-2 text-xs">
                              {item.efektivitasOption}
                            </td>
                            <td rowSpan={rowSpan} className="border border-gray-300 px-2 py-2 text-xs">
                              {item.statusSoal}
                            </td>
                          </>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Statistics */}
            {conversionPreview && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-2 gap-8">
                  {/* Statistics Table */}
                  <div className="border-2 border-gray-300">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="px-4 py-2 text-right font-semibold">JUMLAH :</td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {conversionPreview.studentsData.reduce((sum, s) => sum + s.skor, 0)}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {conversionPreview.studentsData.reduce((sum, s) => sum + s.nilai, 0)}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-4 py-2 text-right font-semibold">TERKECIL :</td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {Math.min(...conversionPreview.studentsData.map(s => s.skor)).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {Math.min(...conversionPreview.studentsData.map(s => s.nilai)).toFixed(2)}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-4 py-2 text-right font-semibold">TERBESAR :</td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {Math.max(...conversionPreview.studentsData.map(s => s.skor)).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {Math.max(...conversionPreview.studentsData.map(s => s.nilai)).toFixed(2)}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-4 py-2 text-right font-semibold">RATA-RATA :</td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {(conversionPreview.studentsData.reduce((sum, s) => sum + s.skor, 0) / conversionPreview.studentsData.length).toFixed(3)}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {(conversionPreview.studentsData.reduce((sum, s) => sum + s.nilai, 0) / conversionPreview.studentsData.length).toFixed(3)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-right font-semibold">SIMPANGAN BAKU :</td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {(() => {
                              const scores = conversionPreview.studentsData.map(s => s.skor);
                              const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
                              const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
                              return Math.sqrt(variance).toFixed(3);
                            })()}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {(() => {
                              const values = conversionPreview.studentsData.map(s => s.nilai);
                              const mean = values.reduce((a, b) => a + b, 0) / values.length;
                              const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                              return Math.sqrt(variance).toFixed(3);
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signature Section */}
                  <div className="flex flex-col justify-between">
                    <div className="text-center mb-8">
                      <p className="font-semibold">{testInfo.schoolName || 'Bantarujeg'}, {testInfo.testDate || '17 Juni 2025'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div className="text-center">
                        <p className="mb-16">Mengetahui,</p>
                        <p className="font-semibold mb-1">Kepala Sekolah</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{testInfo.principalName || 'Dr. H. Toto Warsito, S.Ag., M.Ag'}</p>
                        <p className="text-sm">NIP {testInfo.principalNip || '197303021998021002'}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="mb-16">&nbsp;</p>
                        <p className="font-semibold mb-1">Guru Mata Pelajaran</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{testInfo.teacherName || 'REVI INDIKA, S.Pd., Gr.'}</p>
                        <p className="text-sm">NIP {testInfo.teacherNip || '199404162024212033'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            </div>
            {/* End of PDF Content */}
          </div>
        )}

        {/* PDF Format Selection Modal */}
        <Dialog open={showPdfFormatDialog} onOpenChange={setShowPdfFormatDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pilih Format PDF</DialogTitle>
              <DialogDescription>
                Pilih ukuran kertas untuk file PDF yang akan diunduh
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedPdfFormat === 'a4'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPdfFormat('a4')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">A4</h3>
                    <p className="text-sm text-gray-500">210mm x 297mm (Default)</p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 ${
                    selectedPdfFormat === 'a4'
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedPdfFormat === 'a4' && (
                      <div className="h-full w-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedPdfFormat === 'f4'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPdfFormat('f4')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">F4</h3>
                    <p className="text-sm text-gray-500">215mm x 330mm (Legal)</p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 ${
                    selectedPdfFormat === 'f4'
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedPdfFormat === 'f4' && (
                      <div className="h-full w-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPdfFormatDialog(false)}
              >
                Batal
              </Button>
              <Button
                onClick={() => handleDownloadPDF(selectedPdfFormat)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
