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

    // Extract headers for answer keys (from column 3 onwards)
    const headers = jsonData[0];
    const answerKeys: { [key: string]: string } = {};
    
    // Helper to normalize answers (1->A, 2->B, etc.)
    const normalizeAnswer = (val: any): string => {
      if (val === undefined || val === null) return '';
      const str = String(val).trim().toUpperCase();
      const map: { [key: string]: string } = {
        '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E'
      };
      return map[str] || str;
    };

    for (let i = 2; i < headers.length; i++) {
      answerKeys[i] = normalizeAnswer(headers[i]);
    }

    // Prepare student data
    const studentsData = jsonData.slice(1).map(row => {
      const student: { name: string; class: string; answers: string[]; score?: number } = {
        name: row[0],
        class: row[1],
        answers: row.slice(2).map(ans => normalizeAnswer(ans)),
      };
      return student;
    });

    // Calculate score for each student
    studentsData.forEach(student => {
      let score = 0;
      for (let i = 0; i < student.answers.length; i++) {
        if (student.answers[i]?.toString().trim().toLowerCase() === answerKeys[i + 2]?.toString().trim().toLowerCase()) {
          score++;
        }
      }
      student.score = score;
    });

    // Sort students by score to determine upper and lower groups
    studentsData.sort((a, b) => (b.score || 0) - (a.score || 0));

    const numStudents = studentsData.length;
    const groupSize = Math.floor(numStudents * 0.27); // Standard 27% for upper/lower groups

    const upperGroup = studentsData.slice(0, groupSize);
    const lowerGroup = studentsData.slice(numStudents - groupSize);

    const analysisResults: any[] = [];
    const numQuestions = Object.keys(answerKeys).length;

    for (let qIndex = 0; qIndex < numQuestions; qIndex++) {
      const questionNumber = qIndex + 1;
      const questionKey = answerKeys[qIndex + 2]; // Get the actual answer key from the header

      // Collect all options chosen by students for this question
      const optionStats: { [key: string]: { upper: number; lower: number; total: number } } = {};
      
      studentsData.forEach(student => {
        const answer = student.answers[qIndex]?.toString().trim();
        if (!answer) return;
        
        if (!optionStats[answer]) {
          optionStats[answer] = { upper: 0, lower: 0, total: 0 };
        }
        optionStats[answer].total++;
      });

      // Count upper and lower group answers
      upperGroup.forEach(student => {
        const answer = student.answers[qIndex]?.toString().trim();
        if (answer && optionStats[answer]) {
          optionStats[answer].upper++;
        }
      });

      lowerGroup.forEach(student => {
        const answer = student.answers[qIndex]?.toString().trim();
        if (answer && optionStats[answer]) {
          optionStats[answer].lower++;
        }
      });

      // Calculate statistics for correct answer
      let correctUpper = optionStats[questionKey]?.upper || 0;
      let correctLower = optionStats[questionKey]?.lower || 0;
      let totalCorrect = optionStats[questionKey]?.total || 0;

      // Difficulty Level (P)
      const difficulty = totalCorrect / numStudents;

      // Discrimination Index (D)
      const discrimination = (correctUpper / groupSize) - (correctLower / groupSize);

      // Analyze distractors effectiveness
      const distractors: any[] = [];
      Object.entries(optionStats).forEach(([option, stats]) => {
        if (option.toUpperCase() !== questionKey.toUpperCase()) {
          const chosenByLower = stats.lower;
          const chosenByUpper = stats.upper;
          const totalChosen = stats.total;
          
          // Effectiveness criteria:
          // 1. Should be chosen by lower group more than upper group
          // 2. Should be chosen by some students (5% or more of total)
          const percentageTotal = (totalChosen / numStudents) * 100;
          const isEffective = chosenByLower > chosenByUpper && percentageTotal >= 5;
          
          distractors.push({
            option,
            chosenByUpper,
            chosenByLower,
            totalChosen,
            percentage: percentageTotal.toFixed(1),
            effectiveness: isEffective ? 'Efektif' : (percentageTotal < 5 ? 'Tidak Dipilih' : 'Kurang Efektif'),
            reason: chosenByLower <= chosenByUpper ? 'Lebih banyak dipilih kelompok atas' : (percentageTotal < 5 ? 'Jarang dipilih' : 'Baik')
          });
        }
      });

      analysisResults.push({
        question: `Soal ${questionNumber}`,
        correctAnswer: questionKey,
        difficulty: difficulty.toFixed(2),
        difficultyInterpretation: interpretDifficulty(difficulty),
        discrimination: discrimination.toFixed(2),
        discriminationInterpretation: interpretDiscrimination(discrimination),
        correctAnswerStats: {
          chosenByUpper: correctUpper,
          chosenByLower: correctLower,
          total: totalCorrect,
          percentage: ((totalCorrect / numStudents) * 100).toFixed(1),
        },
        distractors: distractors.sort((a, b) => parseInt(b.totalChosen) - parseInt(a.totalChosen)),
      });
    }

    // Group students by class and sort by name
    const studentsByClass: { [key: string]: any[] } = {};
    
    studentsData.forEach(student => {
      // Skip students with no name or class
      if (!student.name || !student.class) return;
      
      const className = student.class.toString().trim();
      if (!studentsByClass[className]) {
        studentsByClass[className] = [];
      }
      studentsByClass[className].push({
        name: student.name.toString().trim(),
        class: student.class.toString().trim(),
        correct: student.score || 0,
        incorrect: numQuestions - (student.score || 0),
        total: numQuestions,
        score: student.score || 0,
        percentage: (((student.score || 0) / numQuestions) * 100).toFixed(1),
      });
    });

    // Sort names within each class alphabetically
    Object.keys(studentsByClass).forEach(className => {
      studentsByClass[className].sort((a: any, b: any) => {
        const nameA = (a.name || '').toString().toUpperCase();
        const nameB = (b.name || '').toString().toUpperCase();
        return nameA.localeCompare(nameB);
      });
    });

    // Convert to sorted array of classes
    const sortedClasses = Object.keys(studentsByClass).sort();
    const groupedStudents = sortedClasses.map(className => ({
      class: className,
      students: studentsByClass[className],
    }));

    return NextResponse.json({
      analysis: analysisResults,
      groupedStudents: groupedStudents,
      summary: {
        totalQuestions: numQuestions,
        totalStudents: numStudents,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json({ error: 'Failed to process Excel file.' }, { status: 500 });
  }
}

function interpretDifficulty(p: number): string {
  if (p >= 0.7) return 'Mudah (Easy)';
  if (p >= 0.3) return 'Sedang (Medium)';
  return 'Sukar (Difficult)';
}

function interpretDiscrimination(d: number): string {
  if (d >= 0.4) return 'Sangat Baik (Very Good)';
  if (d >= 0.3) return 'Baik (Good)';
  if (d >= 0.2) return 'Cukup (Fair)';
  if (d >= 0.1) return 'Kurang (Poor)';
  return 'Jelek (Bad)';
}