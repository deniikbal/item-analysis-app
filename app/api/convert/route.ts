import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

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

    // Apply conversion to create new data
    const convertedData: string[][] = [];

    // Get converted answer keys for comparison
    const answerKeys: string[] = [];
    for (let i = 2; i < headers.length; i++) {
      const headerValue = headers[i]?.toString().trim();
      answerKeys.push(conversionMappings[i]?.[headerValue] || headerValue);
    }

    // Build header row: Nama | Kelas | Jawaban | Soal 1 | Soal 2 | ... | Total Betul
    const convertedHeader: string[] = [];
    convertedHeader.push(headers[0]); // Nama
    convertedHeader.push(headers[1]); // Kelas
    convertedHeader.push('Jawaban'); // Combined answers column
    
    // Add individual question columns
    for (let i = 2; i < headers.length; i++) {
      const cellValue = headers[i]?.toString().trim();
      convertedHeader.push(conversionMappings[i]?.[cellValue] || cellValue);
    }
    convertedHeader.push('Total Betul');
    
    // Add combined answer keys to header row
    const combinedAnswerKeys = answerKeys.join('');
    convertedHeader[2] = combinedAnswerKeys; // Set the combined key in "Jawaban" column
    convertedData.push(convertedHeader);

    // Convert student data rows and calculate total correct
    dataRows.forEach(row => {
      const convertedRow: string[] = [];
      
      // Add Nama and Kelas
      convertedRow.push(row[0] || '');
      convertedRow.push(row[1] || '');
      
      // Convert answers and collect them for combined column
      const studentAnswers: string[] = [];
      for (let i = 2; i < row.length; i++) {
        const cellValue = row[i]?.toString().trim();
        const converted = conversionMappings[i]?.[cellValue] || cellValue;
        studentAnswers.push(converted);
      }
      
      // Add combined answers column
      const combinedAnswers = studentAnswers.join('');
      convertedRow.push(combinedAnswers);
      
      // Add individual answer columns
      studentAnswers.forEach(answer => convertedRow.push(answer));

      // Calculate total correct answers
      let correctCount = 0;
      for (let i = 0; i < studentAnswers.length; i++) {
        const studentAnswer = studentAnswers[i]?.toString().trim().toUpperCase();
        const correctAnswer = answerKeys[i]?.toString().trim().toUpperCase();
        if (studentAnswer && correctAnswer && studentAnswer === correctAnswer) {
          correctCount++;
        }
      }

      convertedRow.push(correctCount.toString()); // Add total correct count
      convertedData.push(convertedRow);
    });

    // Generate Excel file from converted data
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(convertedData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Converted');

    // Convert to buffer
    const excelBuffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file with conversion mappings
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=converted-answers.xlsx',
        'X-Conversion-Mappings': JSON.stringify(mappingsPreview),
      },
    });

  } catch (error) {
    console.error('Error converting Excel file:', error);
    return NextResponse.json({ error: 'Failed to convert Excel file.' }, { status: 500 });
  }
}
