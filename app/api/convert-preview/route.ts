import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const kkmValue = formData.get('kkm') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Parse KKM, default to 75 if not provided or invalid
    const kkm = parseFloat(kkmValue) || 75;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return NextResponse.json({ error: 'Excel file must contain at least a header and one row of data.' }, { status: 400 });
    }

    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);

    // Store conversion mappings for each question column
    const conversionMappings: { [colIndex: number]: { [textAnswer: string]: string } } = {};
    const mappingsPreview: { questionNumber: number; mapping: { [text: string]: string } }[] = [];

    // Process each question column (from column 3 onwards, index 2+)
    for (let colIndex = 2; colIndex < headers.length; colIndex++) {
      const uniqueAnswers = new Set<string>();

      // Collect unique answers from header (answer key) and all student rows
      const headerValue = headers[colIndex]?.toString().trim();
      if (headerValue) uniqueAnswers.add(headerValue);

      dataRows.forEach(row => {
        const cellValue = row[colIndex]?.toString().trim();
        if (cellValue) uniqueAnswers.add(cellValue);
      });

      // Convert Set to Array and shuffle for randomness
      const answersArray = Array.from(uniqueAnswers);
      const shuffled = answersArray.sort(() => Math.random() - 0.5);

      // Generate letter mapping (A, B, C, D, E, F, ...)
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const mapping: { [textAnswer: string]: string } = {};
      
      shuffled.forEach((answer, idx) => {
        if (idx < letters.length) {
          mapping[answer] = letters[idx];
        }
      });

      conversionMappings[colIndex] = mapping;
      mappingsPreview.push({
        questionNumber: colIndex - 1, // Question 1, 2, 3, ...
        mapping,
      });
    }

    // Get converted answer keys
    const answerKeys: string[] = [];
    for (let i = 2; i < headers.length; i++) {
      const headerValue = headers[i]?.toString().trim();
      answerKeys.push(conversionMappings[i]?.[headerValue] || headerValue);
    }
    const combinedAnswerKeys = answerKeys.join('');

    // Count unique options used
    const allOptionsUsed = new Set<string>();
    answerKeys.forEach(key => allOptionsUsed.add(key));

    // Convert student data
    const studentsData = dataRows.map((row, idx) => {
      const studentAnswers: string[] = [];
      
      // Convert answers
      for (let i = 2; i < row.length; i++) {
        const cellValue = row[i]?.toString().trim();
        const converted = conversionMappings[i]?.[cellValue] || cellValue;
        studentAnswers.push(converted);
      }
      
      const combinedAnswers = studentAnswers.join('');
      
      // Calculate scores
      let correctCount = 0;
      for (let i = 0; i < studentAnswers.length; i++) {
        const studentAnswer = studentAnswers[i]?.toString().trim().toUpperCase();
        const correctAnswer = answerKeys[i]?.toString().trim().toUpperCase();
        if (studentAnswer && correctAnswer && studentAnswer === correctAnswer) {
          correctCount++;
        }
      }
      const incorrectCount = studentAnswers.length - correctCount;
      
      // Calculate score and nilai (assuming each correct = 1 point, scale to 100)
      const skor = correctCount * 1; // 1 point per correct answer
      const nilai = (correctCount / studentAnswers.length) * 100;
      
      return {
        no: idx + 1,
        nama: row[0] || '',
        kelas: row[1] || '',
        jenisKelamin: '', // Not in original data, can be added if needed
        rincianJawaban: combinedAnswers,
        jumlahBenar: correctCount,
        jumlahSalah: incorrectCount,
        skor,
        nilai: Math.round(nilai),
        keterangan: nilai >= kkm ? 'Tuntas' : 'Belum Tuntas',
      };
    });

    // Return preview data as JSON
    return NextResponse.json({
      conversionMappings: mappingsPreview,
      answerKeys: combinedAnswerKeys,
      totalQuestions: answerKeys.length,
      totalOptions: allOptionsUsed.size,
      studentsData,
      headers: {
        nama: headers[0] || 'Nama',
        kelas: headers[1] || 'Kelas',
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error converting Excel file:', error);
    return NextResponse.json({ error: 'Failed to convert Excel file.' }, { status: 500 });
  }
}
