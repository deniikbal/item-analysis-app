'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Upload, Loader, Download, ArrowLeft, BarChart3, FileSpreadsheet, CheckCircle2, FileText, User } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast, { Toaster } from 'react-hot-toast';

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

export default function Home() {
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDataId, setSavedDataId] = useState<number | null>(null);

  // Helper function for natural sorting of class names (X 1, X 2, X 3, X 10...)
  const naturalSortKelas = (a: string, b: string): number => {
    const regex = /(\D+)(\d+)/;
    const aMatch = a.match(regex);
    const bMatch = b.match(regex);
    
    if (aMatch && bMatch) {
      const aPrefix = aMatch[1];
      const bPrefix = bMatch[1];
      const aNumber = parseInt(aMatch[2], 10);
      const bNumber = parseInt(bMatch[2], 10);
      
      // Compare prefix first (e.g., "X" vs "Y")
      if (aPrefix !== bPrefix) {
        return aPrefix.localeCompare(bPrefix);
      }
      // Then compare numbers numerically
      return aNumber - bNumber;
    }
    
    // Fallback to regular string comparison
    return a.localeCompare(b);
  };

  // Helper function to format date to Indonesian format
  const formatDateIndonesia = (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  // Load saved data from database on mount
  const loadSavedData = async () => {
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
          setSavedDataId(data.id);
        }
      }
    } catch (err) {
      console.error('Error loading saved data:', err);
    }
  };

  // Load data from database on component mount
  useEffect(() => {
    loadSavedData();
  }, []); // Empty dependency array = run once on mount

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
        const result = await response.json();
        setSavedDataId(result.data.id);
        setIsEditMode(false);
        toast.success('Data berhasil disimpan!', {
          duration: 3000,
        });
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

      // Auto analyze after conversion
      await performAnalysis(data);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan yang tidak terduga.');
      console.error('Conversion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const performAnalysis = async (conversionData: ConversionPreview) => {
    try {
      const excelData: any[][] = [];
      
      const headerRow = [
        conversionData.headers.nama,
        conversionData.headers.kelas,
      ];
      for (let i = 0; i < conversionData.totalQuestions; i++) {
        headerRow.push(conversionData.answerKeys[i]);
      }
      excelData.push(headerRow);
      
      conversionData.studentsData.forEach(student => {
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

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menganalisis file.');
      }

      const analyzeData = await response.json();
      
      const transformedData: ItemAnalysis[] = analyzeData.analysis.map((item: any, index: number) => {
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
        
        let statusSoal = 'Soal Perlu Direvisi';
        if (dayaBedaValue >= 0.3 && tingkatKesukaranValue >= 0.3 && tingkatKesukaranValue <= 0.7) {
          statusSoal = 'Soal Baik';
        } else if (dayaBedaValue < 0.2 || tingkatKesukaranValue < 0.25 || tingkatKesukaranValue > 0.8) {
          statusSoal = 'Soal Perlu Direvisi';
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
      setTotalStudents(analyzeData.summary.totalStudents);
      setShowAnalysis(true);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat analisis.');
      console.error('Analysis error:', err);
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
        
        let statusSoal = 'Soal Perlu Direvisi';
        if (dayaBedaValue >= 0.3 && tingkatKesukaranValue >= 0.3 && tingkatKesukaranValue <= 0.7) {
          statusSoal = 'Soal Baik';
        } else if (dayaBedaValue < 0.2 || tingkatKesukaranValue < 0.25 || tingkatKesukaranValue > 0.8) {
          statusSoal = 'Soal Perlu Direvisi';
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

  const handleDownloadPDF = async () => {
    if (!conversionPreview || !analysisData) return;

    setLoading(true);

    try {
      const doc: any = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [215, 330], // F4 size
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
        ['MATA PELAJARAN', testInfo.subject || '-', 'TANGGAL TES', formatDateIndonesia(testInfo.testDate)],
        ['KELAS/SEMESTER', testInfo.classInfo || '-', 'KOMPETENSI DASAR', testInfo.competencyBasis || '-'],
        ['NAMA TES', testInfo.testName || '-', 'KKM', testInfo.kkm || '75'],
        ['GURU MATA PELAJARAN', testInfo.teacherName || '-', 'JUMLAH SOAL', conversionPreview.totalQuestions.toString()],
        ['NIP GURU', testInfo.teacherNip || '-', 'JUMLAH OPTION', conversionPreview.totalOptions.toString()],
        ['KEPALA SEKOLAH', testInfo.principalName || '-', 'JUMLAH SISWA', totalStudents.toString()],
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

      // Statistics Cards - Tuntas/Belum Tuntas (Compact)
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 15;
      }

      const kkm = parseFloat(testInfo.kkm) || 75;
      const tuntasCount = conversionPreview.studentsData.filter(s => s.nilai >= kkm).length;
      const belumTuntasCount = conversionPreview.studentsData.filter(s => s.nilai < kkm).length;
      const persentaseTuntas = ((tuntasCount / totalStudents) * 100).toFixed(1);
      const persentaseBelumTuntas = ((belumTuntasCount / totalStudents) * 100).toFixed(1);

      // Title for statistics cards
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('STATISTIK KETUNTASAN SISWA', 10, yPosition);
      yPosition += 4;

      // Draw two cards side by side (compact)
      const cardWidth = 95;
      const cardHeight = 22;
      const cardSpacing = 5;
      const leftCardX = 10;
      const rightCardX = leftCardX + cardWidth + cardSpacing;

      // Card Tuntas (Green)
      doc.setFillColor(34, 197, 94); // Emerald/Green
      doc.roundedRect(leftCardX, yPosition, cardWidth, cardHeight, 1.5, 1.5, 'F');
      
      // White icon circle (smaller)
      doc.setFillColor(255, 255, 255);
      doc.circle(leftCardX + 6, yPosition + 6, 3.5, 'F');
      
      // Check icon (smaller)
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.7);
      doc.line(leftCardX + 4.5, yPosition + 6, leftCardX + 5.5, yPosition + 7);
      doc.line(leftCardX + 5.5, yPosition + 7, leftCardX + 7.5, yPosition + 5);

      // Text for Tuntas card (compact)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('TUNTAS', leftCardX + 12, yPosition + 5);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(tuntasCount.toString(), leftCardX + 12, yPosition + 13);
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text('SISWA', leftCardX + 12, yPosition + 17);

      // Progress bar background for Tuntas (thinner)
      doc.setFillColor(255, 255, 255, 0.3);
      doc.roundedRect(leftCardX + 3, yPosition + 18.5, cardWidth - 6, 2, 0.5, 0.5, 'F');
      
      // Progress bar fill for Tuntas
      const tuntasBarWidth = ((cardWidth - 6) * parseFloat(persentaseTuntas)) / 100;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(leftCardX + 3, yPosition + 18.5, tuntasBarWidth, 2, 0.5, 0.5, 'F');
      
      // Percentage text for Tuntas
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${persentaseTuntas}%`, leftCardX + cardWidth - 18, yPosition + 13);

      // Card Belum Tuntas (Red/Orange)
      doc.setFillColor(239, 68, 68); // Red
      doc.roundedRect(rightCardX, yPosition, cardWidth, cardHeight, 1.5, 1.5, 'F');
      
      // White icon circle (smaller)
      doc.setFillColor(255, 255, 255);
      doc.circle(rightCardX + 6, yPosition + 6, 3.5, 'F');
      
      // Alert icon (smaller exclamation mark)
      doc.setFillColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('!', rightCardX + 5.2, yPosition + 7.5);

      // Text for Belum Tuntas card (compact)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('BELUM TUNTAS', rightCardX + 12, yPosition + 5);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(belumTuntasCount.toString(), rightCardX + 12, yPosition + 13);
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text('SISWA', rightCardX + 12, yPosition + 17);

      // Progress bar background for Belum Tuntas (thinner)
      doc.setFillColor(255, 255, 255, 0.3);
      doc.roundedRect(rightCardX + 3, yPosition + 18.5, cardWidth - 6, 2, 0.5, 0.5, 'F');
      
      // Progress bar fill for Belum Tuntas
      const belumTuntasBarWidth = ((cardWidth - 6) * parseFloat(persentaseBelumTuntas)) / 100;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(rightCardX + 3, yPosition + 18.5, belumTuntasBarWidth, 2, 0.5, 0.5, 'F');
      
      // Percentage text for Belum Tuntas
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${persentaseBelumTuntas}%`, rightCardX + cardWidth - 18, yPosition + 13);

      yPosition += cardHeight + 6;

      // Student Data Table
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('DATA SISWA', 10, yPosition);
      yPosition += 5;

      const sortedStudents = [...conversionPreview.studentsData].sort((a, b) => {
        const kelasCompare = naturalSortKelas(a.kelas || '', b.kelas || '');
        if (kelasCompare !== 0) return kelasCompare;
        return (a.nama || '').localeCompare(b.nama || '');
      });

      const studentData = sortedStudents.map((student, index) => [
        (index + 1).toString(),
        student.nama.toUpperCase().substring(0, 25),
        student.kelas || '-',
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
          ['No.', 'Nama', 'Kelas', 'Rincian Jawaban', 'Benar', 'Salah', 'Skor', 'Nilai', 'Ket.']
        ],
        body: studentData,
        theme: 'grid',
        styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak', halign: 'center' },
        headStyles: { fillColor: [251, 146, 60], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40, halign: 'left' },
          2: { cellWidth: 13 },
          3: { cellWidth: 58, halign: 'left', fontSize: 5 },
          4: { cellWidth: 11 },
          5: { cellWidth: 11 },
          6: { cellWidth: 11 },
          7: { cellWidth: 11 },
          8: { cellWidth: 27, fontSize: 5 },
        },
        margin: { left: 10, right: 10 },
        didDrawCell: function(data: any) {
          // Add badge color for Keterangan column (column index 8)
          if (data.section === 'body' && data.column.index === 8) {
            const keterangan = data.cell.raw;
            
            // Check "Belum Tuntas" first (more specific) before checking "Tuntas"
            if (keterangan && keterangan.includes('Belum Tuntas')) {
              // Red badge for "Belum Tuntas"
              doc.setFillColor(239, 68, 68); // Red
              doc.roundedRect(data.cell.x + 1, data.cell.y + 0.5, data.cell.width - 2, data.cell.height - 1, 1, 1, 'F');
              
              // White text
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(5);
              doc.setFont('helvetica', 'bold');
              doc.text(keterangan, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 0.5, { 
                align: 'center' 
              });
            } else if (keterangan && keterangan.includes('Tuntas')) {
              // Green badge for "Tuntas" (checked after "Belum Tuntas")
              doc.setFillColor(34, 197, 94); // Green
              doc.roundedRect(data.cell.x + 1, data.cell.y + 0.5, data.cell.width - 2, data.cell.height - 1, 1, 1, 'F');
              
              // White text
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(5);
              doc.setFont('helvetica', 'bold');
              doc.text(keterangan, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 0.5, { 
                align: 'center' 
              });
            }
          }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 8;

      // Add signature section after student data table
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      // Signature section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      yPosition += 10;

      // Signature section - two columns with 192mm total width
      const leftMargin = 20;
      const sectionWidth = 192;
      const rightColumnStart = leftMargin + 120;
      
      // Date and location (right column, left-aligned)
      const todaySign = new Date();
      const monthsSign = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const dateStrSign = `Bantarujeg, ${todaySign.getDate()} ${monthsSign[todaySign.getMonth()]} ${todaySign.getFullYear()}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(dateStrSign, rightColumnStart, yPosition);

      yPosition += 7;
      
      // Column headers
      doc.text('Mengetahui,', leftMargin, yPosition);
      doc.text('Guru Mata Pelajaran', rightColumnStart, yPosition);
      
      yPosition += 5;
      doc.text('Kepala Sekolah', leftMargin, yPosition);

      yPosition += 20; // Space for signature

      // Names and NIP
      doc.setFont('helvetica', 'bold');
      doc.text(testInfo.principalName || 'Dr. H. Toto Warsito, S.Ag., M.Ag', leftMargin, yPosition);
      doc.text(testInfo.teacherName || 'REVI INDIKA, S.Pd., Gr.', rightColumnStart, yPosition);
      
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`NIP ${testInfo.principalNip || '197303021998021002'}`, leftMargin, yPosition);
      doc.text(`NIP ${testInfo.teacherNip || '199404416202412033'}`, rightColumnStart, yPosition);

      // Page break before Analysis Statistics Table
      doc.addPage();
      yPosition = 15;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('STATISTIK ANALISIS BUTIR', 10, yPosition);
      yPosition += 5;

      // Transform data to use rowSpan properly
      const bodyData: any[] = [];
      let currentRow = 0;
      
      analysisData.forEach((item, idx) => {
        const rowsForItem = item.options.length;
        
        item.options.forEach((opt, optIdx) => {
          const row: any[] = [];
          
          if (optIdx === 0) {
            // First row of each item - include all data with rowSpan for Tafsiran columns
            row.push(
              (idx + 1).toString(),
              item.propCorrect.toFixed(3),
              item.biser.toFixed(3),
              item.pointBiser.toFixed(3),
              opt.option,
              opt.propEndorsing.toFixed(3),
              opt.isKey ? '★' : '',
              { content: item.tingkatKesukaran, rowSpan: rowsForItem, styles: { valign: 'middle', cellPadding: 1 } },
              { content: item.dayaBeda, rowSpan: rowsForItem, styles: { valign: 'middle', cellPadding: 1 } },
              { content: item.efektivitasOption, rowSpan: rowsForItem, styles: { valign: 'middle', cellPadding: 1 } },
              { content: item.statusSoal, rowSpan: rowsForItem, styles: { valign: 'middle', cellPadding: 1 } }
            );
          } else {
            // Subsequent rows - only option data
            row.push(
              '', '', '', '',
              opt.option,
              opt.propEndorsing.toFixed(3),
              opt.isKey ? '★' : ''
            );
          }
          
          bodyData.push(row);
          currentRow++;
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
        body: bodyData,
        theme: 'grid',
        styles: { 
          fontSize: 5, 
          cellPadding: 1, 
          overflow: 'linebreak', 
          halign: 'center',
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          valign: 'middle'
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
          7: { cellWidth: 25, fontSize: 5.5, valign: 'middle' },
          8: { cellWidth: 25, fontSize: 5.5, valign: 'middle' },
          9: { cellWidth: 27, fontSize: 5.5, valign: 'middle' },
          10: { cellWidth: 23, fontSize: 5.5, valign: 'middle' },
        },
        margin: { left: 10, right: 10 },
        didDrawCell: function(data: any) {
          // Highlight key answers with background and marker
          if (data.column.index === 6 && data.cell.raw === '★') {
            // Fill background with gold color
            doc.setFillColor(255, 215, 0);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            
            // Draw black circle or simple marker
            const centerX = data.cell.x + data.cell.width / 2;
            const centerY = data.cell.y + data.cell.height / 2;
            
            // Draw filled circle
            doc.setFillColor(0, 0, 0); // Black
            doc.circle(centerX, centerY, 1.5, 'F');
            
            // Alternative: Use simple text like checkmark or asterisk
            // doc.setTextColor(0, 0, 0);
            // doc.setFontSize(9);
            // doc.setFont('helvetica', 'bold');
            // doc.text('*', centerX, centerY + 1.5, { align: 'center' });
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

      // Signature section 2 - two columns with 192mm total width
      const leftMargin2 = 20;
      const sectionWidth2 = 192; // Total width consistent with other sections
      const rightColumnStart2 = leftMargin2 + 120; // 11.5 + 96 = 107.5mm
      
      // Date and location (right column, left-aligned)
      const today2 = new Date();
      const months2 = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const dateStr2 = `Bantarujeg, ${today2.getDate()} ${months2[today2.getMonth()]} ${today2.getFullYear()}`;
      doc.text(dateStr2, rightColumnStart2, yPosition);

      yPosition += 7;
      
      // Column headers
      doc.text('Mengetahui,', leftMargin2, yPosition);
      doc.text('Guru Mata Pelajaran', rightColumnStart2, yPosition);
      
      yPosition += 5;
      doc.text('Kepala Sekolah', leftMargin2, yPosition);

      yPosition += 20; // Space for signature

      // Names and NIP
      doc.setFont('helvetica', 'bold');
      doc.text(testInfo.principalName || 'Dr. H. Toto Warsito, S.Ag., M.Ag', leftMargin2, yPosition);
      doc.text(testInfo.teacherName || 'REVI INDIKA, S.Pd., Gr.', rightColumnStart2, yPosition);
      
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`NIP ${testInfo.principalNip || '197303021998021002'}`, leftMargin2, yPosition);
      doc.text(`NIP ${testInfo.teacherNip || '199404416202412033'}`, rightColumnStart2, yPosition);

      // Generate filename: ANABUT_(Nama Guru)_(Mata Pelajaran)_Tahun Pelajaran
      const cleanName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      const teacherName = cleanName(testInfo.teacherName || 'Guru');
      const subject = cleanName(testInfo.subject || 'MataPelajaran');
      const academicYear = cleanName(testInfo.academicYear || 'TahunPelajaran');
      const filename = `ANABUT_${teacherName}_${subject}_${academicYear}.pdf`;
      doc.save(filename);
      
      // Show success toast
      toast.success(`PDF berhasil didownload!`, {
        duration: 4000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat PDF. Silakan coba lagi.');
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
        ['MATA PELAJARAN', ':', testInfo.subject || '-', 'TANGGAL TES', ':', formatDateIndonesia(testInfo.testDate)],
        ['KELAS/SEMESTER', ':', testInfo.classInfo || '-', 'NAMA TES', ':', testInfo.testName || '-'],
        ['KOMPETENSI DASAR', ':', testInfo.competencyBasis || '-', '', '', ''],
        ['GURU MATA PELAJARAN', ':', testInfo.teacherName || '-', '', '', ''],
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
      const studentHeaders = ['No.', 'Nama', 'Kelas', 'RINCIAN JAWABAN SISWA', 'BENAR', 'SALAH', 'SKOR', 'NILAI', 'KET.'];
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

      // Student Data Rows - sorted by kelas then name
      const sortedExcelStudents = [...conversionPreview.studentsData].sort((a, b) => {
        const kelasCompare = naturalSortKelas(a.kelas || '', b.kelas || '');
        if (kelasCompare !== 0) return kelasCompare;
        return (a.nama || '').localeCompare(b.nama || '');
      });

      sortedExcelStudents.forEach((student, index) => {
        setCell(`A${currentRow + 1}`, index + 1, { alignment: { horizontal: 'center' } });
        setCell(`B${currentRow + 1}`, student.nama.toUpperCase());
        setCell(`C${currentRow + 1}`, student.kelas || '-', { alignment: { horizontal: 'center' } });
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
      const today = new Date();
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const dateStr = `${testInfo.schoolName || 'Bantarujeg'}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
      
      setCell(`A${currentRow + 1}`, dateStr, {
        alignment: { horizontal: 'right' },
        font: { bold: false }
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
      // Generate filename: ANABUT_(Nama Guru)_(Mata Pelajaran)_Tahun Pelajaran
      const cleanName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      const teacherName = cleanName(testInfo.teacherName || 'Guru');
      const subject = cleanName(testInfo.subject || 'MataPelajaran');
      const academicYear = cleanName(testInfo.academicYear || 'TahunPelajaran');
      const excelFilename = `ANABUT_${teacherName}_${subject}_${academicYear}.xlsx`;
      XLSX.writeFile(wb, excelFilename);

      // Show success toast
      toast.success(`Excel berhasil didownload!`, {
        duration: 4000,
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Gagal membuat Excel. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{}}
        toastOptions={{
          className: '',
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            duration: 3000,
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
              <Upload className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">Upload Jawaban</h1>
              <p className="text-slate-600 text-xs sm:text-sm">Konversi file Excel dan analisis hasil ulangan secara otomatis</p>
            </div>
          </div>
        </div>

        {/* Usage Guide */}
        <Card className="mb-4 sm:mb-6 border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 bg-emerald-600 rounded-lg flex-shrink-0">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-emerald-900 mb-2 sm:mb-3 text-base sm:text-lg">Upload & Konversi Excel</h3>
                <div className="space-y-2 text-xs sm:text-sm text-emerald-800">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">1.</span>
                    <p><strong>Siapkan file Excel</strong> dengan format: Kolom pertama berisi nama siswa,kolom kedua kelas,kolom berikutnya berisi jawaban untuk setiap nomor soal.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">2.</span>
                    <p><strong>Klik "Choose File"</strong> dan pilih file Excel (.xlsx atau .xls) yang sudah disiapkan.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">3.</span>
                    <p><strong>Klik tombol "Konversi"</strong> untuk memproses file. Sistem akan otomatis mengkonversi jawaban teks ke huruf (A, B, C, D, E).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">4.</span>
                    <p><strong>Lihat hasil analisis</strong> yang mencakup: Data Siswa, Analisis Butir Soal, Statistik, dan Detail Konversi.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">5.</span>
                    <p><strong>Download hasil</strong> dengan klik tombol "Unduh Excel" untuk file Excel atau "Unduh PDF" untuk laporan lengkap.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload & Convert Section */}
        <Card className="mb-6 sm:mb-8 shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
              <div>
                <CardTitle className="text-base sm:text-lg md:text-xl">Upload & Konversi Excel</CardTitle>
                <p className="text-emerald-100 text-xs sm:text-sm mt-1">Upload file Excel untuk dikonversi dan dianalisis</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 sm:p-6 md:p-8 bg-slate-50/50 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-200">
                <div className="flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full">
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Upload File Excel</h3>
                    <p className="text-xs sm:text-sm text-slate-600">Format: .xlsx atau .xls</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full max-w-2xl">
                    <Input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="flex-1 w-full border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 cursor-pointer text-xs sm:text-sm"
                    />
                    <Button
                      onClick={handleConvert}
                      disabled={!selectedFile || loading}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg px-6 sm:px-8 gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm"
                      size="default"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                          Konversi
                        </>
                      )}
                    </Button>
                  </div>
                  {selectedFile && !error && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-700 bg-emerald-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg max-w-full">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium truncate">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 rounded-r-lg p-4 flex items-start shadow-md">
                  <AlertCircle className="h-5 w-5 text-rose-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-800 mb-1">Terjadi Kesalahan</h4>
                    <p className="text-sm text-rose-700">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Preview */}
        {conversionPreview && (
          <div className="space-y-6">

          </div>
        )}

        {/* Analysis Results Table */}
        {showAnalysis && analysisData && (
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                      <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg sm:text-xl md:text-2xl">Hasil Analisis Statistik</CardTitle>
                      <p className="text-emerald-100 text-xs sm:text-sm mt-1">Hasil konversi dan analisis telah selesai</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      onClick={handleDownloadStyledExcel}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm"
                      disabled={loading}
                      size="default"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Excel
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownloadPDF}
                      className="bg-rose-500 hover:bg-rose-600 text-white shadow-lg gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm"
                      disabled={loading}
                      size="default"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

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
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur mb-6">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg py-3">
                <div className="text-center">
                  <CardTitle className="text-xl font-bold mb-1">Analisis Hasil Ulangan</CardTitle>
                  <p className="text-emerald-100 text-sm">Tipe Soal: Pilihan Ganda</p>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
                  <div className="flex items-start text-sm">
                    <span className="font-semibold text-slate-700 w-44 flex-shrink-0">NAMA SEKOLAH</span>
                    <span className="mx-2 text-slate-400">:</span>
                    <span className="text-blue-600 font-medium">{testInfo.schoolName || '-'}</span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="font-semibold text-slate-700 w-44 flex-shrink-0">TAHUN PELAJARAN</span>
                    <span className="mx-2 text-slate-400">:</span>
                    <span className="text-blue-600 font-medium">{testInfo.academicYear || '-'}</span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="font-semibold text-slate-700 w-44 flex-shrink-0">MATA PELAJARAN</span>
                    <span className="mx-2 text-slate-400">:</span>
                    <span className="text-blue-600 font-medium">{testInfo.subject || '-'}</span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="font-semibold text-slate-700 w-44 flex-shrink-0">TANGGAL TES</span>
                    <span className="mx-2 text-slate-400">:</span>
                    <span className="text-blue-600 font-medium">{formatDateIndonesia(testInfo.testDate)}</span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="font-semibold text-slate-700 w-44 flex-shrink-0">KELAS/SEMESTER</span>
                    <span className="mx-2 text-slate-400">:</span>
                    <span className="text-blue-600 font-medium">{testInfo.classInfo || '-'}</span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="font-semibold text-slate-700 w-44 flex-shrink-0">NAMA TES</span>
                    <span className="mx-2 text-slate-400">:</span>
                    <span className="text-blue-600 font-medium">{testInfo.testName || '-'}</span>
                  </div>
                  <div className="flex items-start text-sm md:col-span-2">
                    <span className="font-semibold text-slate-700 w-44 flex-shrink-0">KOMPETENSI DASAR</span>
                    <span className="mx-2 text-slate-400">:</span>
                    <span className="text-blue-600 font-medium">{testInfo.competencyBasis || '-'}</span>
                  </div>
                  <div className="flex items-start text-sm md:col-span-2">
                    <span className="font-semibold text-slate-700 w-44 flex-shrink-0">GURU MATA PELAJARAN</span>
                    <span className="mx-2 text-slate-400">:</span>
                    <span className="text-blue-600 font-medium">{testInfo.teacherName || '-'}</span>
                  </div>
                </div>

                {/* Bottom Cards */}
                <div className="border-t border-slate-200 pt-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Data Soal Card */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-4 shadow-sm">
                      <h3 className="font-bold text-center mb-3 text-emerald-800 text-base flex items-center justify-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Data Soal Pilihan Ganda
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-white/80 backdrop-blur px-3 py-1.5 rounded-md text-xs">
                          <span className="font-medium text-slate-700">Jumlah Soal:</span>
                          <span className="font-bold text-emerald-700">{conversionPreview.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/80 backdrop-blur px-3 py-1.5 rounded-md text-xs">
                          <span className="font-medium text-slate-700">Jumlah Option:</span>
                          <span className="font-bold text-emerald-700">5</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/80 backdrop-blur px-3 py-1.5 rounded-md text-xs">
                          <span className="font-medium text-slate-700">Skor Benar:</span>
                          <span className="font-bold text-emerald-700">1</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/80 backdrop-blur px-3 py-1.5 rounded-md text-xs">
                          <span className="font-medium text-slate-700">Skor Salah:</span>
                          <span className="font-bold text-emerald-700">0</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/80 backdrop-blur px-3 py-1.5 rounded-md text-xs">
                          <span className="font-medium text-slate-700">Skala Nilai:</span>
                          <span className="font-bold text-emerald-700">100</span>
                        </div>
                      </div>
                    </div>

                    {/* Kunci Jawaban Card */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-4 shadow-sm">
                      <h3 className="font-bold text-center mb-3 text-emerald-800 text-base flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Rincian Kunci Jawaban
                      </h3>
                      <div className="bg-white/80 backdrop-blur rounded-md border border-emerald-200 p-4 text-center shadow-sm min-h-[140px] flex items-center justify-center">
                        <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-wider break-all">
                          {conversionPreview.answerKeys}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards - Tuntas/Belum Tuntas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {(() => {
                const kkm = parseFloat(testInfo.kkm) || 75;
                const tuntas = conversionPreview.studentsData.filter(s => s.nilai >= kkm).length;
                const belumTuntas = conversionPreview.studentsData.filter(s => s.nilai < kkm).length;
                const persentaseTuntas = ((tuntas / conversionPreview.studentsData.length) * 100).toFixed(1);
                const persentaseBelumTuntas = ((belumTuntas / conversionPreview.studentsData.length) * 100).toFixed(1);
                
                return (
                  <>
                    {/* Card Tuntas */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 transform hover:scale-102 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                      <CardContent className="p-5 relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-white rounded-xl shadow-md">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-white drop-shadow-lg">{tuntas}</div>
                            <div className="text-xs font-semibold text-emerald-100 uppercase tracking-wide">Siswa</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-white font-bold text-sm">Tuntas</span>
                              <span className="text-white font-black text-lg">{persentaseTuntas}%</span>
                            </div>
                            <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-white h-full rounded-full shadow-md transition-all duration-500"
                                style={{ width: `${persentaseTuntas}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-white text-xs">
                            <span className="font-medium">Total Siswa:</span>
                            <span className="font-bold">{conversionPreview.studentsData.length}</span>
                          </div>
                          <div className="text-center py-1.5 bg-white/20 backdrop-blur-sm rounded-md border border-white/30">
                            <span className="text-white font-bold text-xs">Nilai ≥ {kkm} (KKM)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card Belum Tuntas */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 transform hover:scale-102 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                      <CardContent className="p-5 relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-white rounded-xl shadow-md">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-white drop-shadow-lg">{belumTuntas}</div>
                            <div className="text-xs font-semibold text-orange-100 uppercase tracking-wide">Siswa</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-white font-bold text-sm">Belum Tuntas</span>
                              <span className="text-white font-black text-lg">{persentaseBelumTuntas}%</span>
                            </div>
                            <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-white h-full rounded-full shadow-md transition-all duration-500"
                                style={{ width: `${persentaseBelumTuntas}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-white text-xs">
                            <span className="font-medium">Total Siswa:</span>
                            <span className="font-bold">{conversionPreview.studentsData.length}</span>
                          </div>
                          <div className="text-center py-1.5 bg-white/20 backdrop-blur-sm rounded-md border border-white/30">
                            <span className="text-white font-bold text-xs">Nilai &lt; {kkm} (KKM)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>

            {/* Student Data Table */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur mb-6">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg py-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Data Siswa</CardTitle>
                    <p className="text-emerald-100 text-xs mt-0.5">Daftar siswa dan hasil jawaban ulangan</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        <th className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">No.<br/>Urut</th>
                        <th className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Nama</th>
                        <th className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Kelas</th>
                        <th className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Rincian Jawaban Siswa</th>
                        <th colSpan={2} className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Jumlah</th>
                        <th className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Skor</th>
                        <th className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Nilai</th>
                        <th className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Ket.</th>
                      </tr>
                      <tr className="bg-emerald-50">
                        <th className="border border-slate-200 px-2 py-1"></th>
                        <th className="border border-slate-200 px-2 py-1"></th>
                        <th className="border border-slate-200 px-2 py-1"></th>
                        <th className="border border-slate-200 px-2 py-1"></th>
                        <th className="border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">Benar</th>
                        <th className="border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">Salah</th>
                        <th className="border border-slate-200 px-2 py-1"></th>
                        <th className="border border-slate-200 px-2 py-1"></th>
                        <th className="border border-slate-200 px-2 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...conversionPreview.studentsData]
                        .sort((a, b) => {
                          // Sort by kelas first with natural sorting
                          const kelasCompare = naturalSortKelas(a.kelas || '', b.kelas || '');
                          if (kelasCompare !== 0) return kelasCompare;
                          // Then sort by name alphabetically
                          return (a.nama || '').localeCompare(b.nama || '');
                        })
                        .map((student, index) => (
                        <tr key={student.no} className="hover:bg-emerald-50/50 transition-colors duration-150">
                          <td className="border border-slate-200 px-2 py-1.5 text-center text-xs">{index + 1}</td>
                          <td className="border border-slate-200 px-2 py-1.5 text-xs">{student.nama.toUpperCase()}</td>
                          <td className="border border-slate-200 px-2 py-1.5 text-center text-xs">{student.kelas || '-'}</td>
                          <td className="border border-slate-200 px-2 py-1.5 font-mono text-xs break-all">{student.rincianJawaban}</td>
                          <td className="border border-slate-200 px-2 py-1.5 text-center font-semibold text-xs text-emerald-600">{student.jumlahBenar}</td>
                          <td className="border border-slate-200 px-2 py-1.5 text-center font-semibold text-xs text-orange-600">{student.jumlahSalah}</td>
                          <td className="border border-slate-200 px-2 py-1.5 text-center text-xs">{student.skor}</td>
                          <td className="border border-slate-200 px-2 py-1.5 text-center font-semibold text-xs">{student.nilai}</td>
                          <td className="border border-slate-200 px-2 py-1.5 text-center text-xs">{student.keterangan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            </>
            )}

            {/* Analysis Statistics Table */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg py-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Statistik Analisis Butir</CardTitle>
                    <p className="text-emerald-100 text-xs mt-0.5">Analisis statistik item dan option soal</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        <th rowSpan={2} className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">No.</th>
                        <th colSpan={3} className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Statistics Item</th>
                        <th colSpan={3} className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Statistics Option</th>
                        <th colSpan={4} className="border border-emerald-300 px-2 py-2 text-center font-bold text-xs">Tafsiran</th>
                      </tr>
                      <tr className="bg-emerald-50">
                        <th className="border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 w-20">Prop. Correct</th>
                        <th className="border border-slate-200 px-1 py-1.5 text-xs font-semibold text-slate-700 w-16">Biser</th>
                        <th className="border border-slate-200 px-1 py-1.5 text-xs font-semibold text-slate-700 w-16">Pt.Biser</th>
                        <th className="border border-slate-200 px-1 py-1.5 text-xs font-semibold text-slate-700 w-12">Opt.</th>
                        <th className="border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 w-20">Prop. End</th>
                        <th className="border border-slate-200 px-1 py-1.5 text-xs font-semibold text-slate-700 w-12">Key</th>
                        <th className="border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700">T. Kesukaran</th>
                        <th className="border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700">D. Beda</th>
                        <th className="border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700">Efek. Opt</th>
                        <th className="border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.map((item, idx) => {
                        const rowSpan = item.options.length;
                        return item.options.map((opt, optIdx) => (
                          <tr key={`${idx}-${optIdx}`} className="hover:bg-emerald-50/50 transition-colors duration-150">
                            {optIdx === 0 && (
                              <>
                                <td rowSpan={rowSpan} className="border border-slate-200 px-1 py-1.5 text-center font-medium text-xs bg-slate-50">
                                  {idx + 1}
                                </td>
                                <td rowSpan={rowSpan} className="border border-slate-200 px-1 py-1.5 text-center text-xs w-20">
                                  {item.propCorrect.toFixed(3)}
                                </td>
                                <td rowSpan={rowSpan} className="border border-slate-200 px-1 py-1.5 text-center text-xs w-16">
                                  {item.biser.toFixed(3)}
                                </td>
                                <td rowSpan={rowSpan} className="border border-slate-200 px-1 py-1.5 text-center text-xs w-16">
                                  {item.pointBiser.toFixed(3)}
                                </td>
                              </>
                            )}
                            <td className="border border-slate-200 px-1 py-1.5 text-center font-medium text-xs bg-slate-50 w-12">
                              {opt.option}
                            </td>
                            <td className="border border-slate-200 px-1 py-1.5 text-center text-xs w-20">
                              {opt.propEndorsing.toFixed(3)}
                            </td>
                            <td className="border border-slate-200 px-1 py-1.5 text-center text-amber-500 font-bold text-base w-12">
                              {opt.isKey ? '★' : ''}
                            </td>
                            {optIdx === 0 && (
                              <>
                                <td rowSpan={rowSpan} className="border border-slate-200 px-2 py-1.5 text-xs">
                                  {item.tingkatKesukaran}
                                </td>
                                <td rowSpan={rowSpan} className="border border-slate-200 px-2 py-1.5 text-xs">
                                  {item.dayaBeda}
                                </td>
                                <td rowSpan={rowSpan} className="border border-slate-200 px-2 py-1.5 text-xs">
                                  {item.efektivitasOption}
                                </td>
                                <td rowSpan={rowSpan} className="border border-slate-200 px-2 py-1.5 text-xs">
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
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            {conversionPreview && (
              <div className="bg-white rounded-sm shadow-lg p-6 border border-gray-200 mt-6">
                {/* Statistics Table - Single Column */}
                <div className="max-w-md mx-auto mb-8">
                  <div className="border-2 border-gray-300">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="px-4 py-2 text-right font-semibold w-1/2">JUMLAH :</td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {conversionPreview.studentsData.reduce((sum, s) => sum + s.skor, 0)} / {conversionPreview.studentsData.reduce((sum, s) => sum + s.nilai, 0)}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-4 py-2 text-right font-semibold">TERKECIL :</td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {Math.min(...conversionPreview.studentsData.map(s => s.skor)).toFixed(2)} / {Math.min(...conversionPreview.studentsData.map(s => s.nilai)).toFixed(2)}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-4 py-2 text-right font-semibold">TERBESAR :</td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {Math.max(...conversionPreview.studentsData.map(s => s.skor)).toFixed(2)} / {Math.max(...conversionPreview.studentsData.map(s => s.nilai)).toFixed(2)}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-4 py-2 text-right font-semibold">RATA-RATA :</td>
                          <td className="px-4 py-2 text-center border-l border-gray-300">
                            {(conversionPreview.studentsData.reduce((sum, s) => sum + s.skor, 0) / conversionPreview.studentsData.length).toFixed(3)} / {(conversionPreview.studentsData.reduce((sum, s) => sum + s.nilai, 0) / conversionPreview.studentsData.length).toFixed(3)}
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
                            })()} / {(() => {
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
                </div>

                {/* Signature Section */}
                <div className="border-t-4 border-gradient-to-r from-purple-300 to-indigo-300 pt-8 mt-8">
                  <div className="grid grid-cols-2 gap-20 max-w-5xl mx-auto px-12">
                    {/* Kolom Kiri - Kepala Sekolah */}
                    <div className="text-left">
                      <p className="mb-2 text-base">Mengetahui,</p>
                      <p className="font-semibold mb-20 text-base">Kepala Sekolah</p>
                      <p className="font-bold text-lg border-b-2 border-black inline-block pb-1">
                        {testInfo.principalName || 'Dr. H. Toto Warsito, S.Ag., M.Ag'}
                      </p>
                      <p className="text-sm mt-2">NIP {testInfo.principalNip || '197303021998021002'}</p>
                    </div>
                    
                    {/* Kolom Kanan - Guru Mata Pelajaran */}
                    <div className="text-left">
                      <p className="mb-2 text-base">
                        {'Bantarujeg'}, {(() => {
                          const today = new Date();
                          const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                          return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
                        })()}
                      </p>
                      <p className="font-semibold mb-20 text-base">Guru Mata Pelajaran</p>
                      <p className="font-bold text-lg border-b-2 border-black inline-block pb-1">
                        {testInfo.teacherName || 'REVI INDIKA, S.Pd., Gr.'}
                      </p>
                      <p className="text-sm mt-2">NIP {testInfo.teacherNip || '199404162024212033'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Konversi per Soal */}
            {conversionPreview && (
              <Card className="mt-6 shadow-xl border-0 bg-white/80 backdrop-blur">
                <CardHeader className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg py-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Detail Konversi per Soal</CardTitle>
                      <p className="text-emerald-100 text-xs mt-0.5">Mapping jawaban teks ke huruf pilihan</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {conversionPreview.conversionMappings.map((item) => (
                      <div key={item.questionNumber} className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md text-white text-sm font-bold shadow">
                            {item.questionNumber}
                          </div>
                          <h3 className="font-semibold text-sm text-slate-800">
                            Soal {item.questionNumber}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 pl-9">
                          {Object.entries(item.mapping).map(([text, letter]) => (
                            <div
                              key={text}
                              className="group/item flex items-center justify-between bg-gradient-to-br from-slate-50 to-emerald-50/30 p-2 rounded-md border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all duration-200"
                            >
                              <span className="truncate flex-1 mr-1.5 text-xs font-medium text-slate-700 group-hover/item:text-slate-900">
                                {text}
                              </span>
                              <div className="flex items-center justify-center min-w-[1.75rem] h-6 px-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-md text-sm font-bold shadow group-hover/item:shadow-lg group-hover/item:scale-105 transition-all duration-200">
                                {letter}
                              </div>
                            </div>
                          ))}
                        </div>
                        {item.questionNumber !== conversionPreview.conversionMappings.length && (
                          <div className="mt-4 border-b border-slate-200"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            </div>
            {/* End of PDF Content */}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
