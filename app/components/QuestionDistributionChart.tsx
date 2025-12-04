'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OptionStat {
  option: string;
  propEndorsing: number;
  isKey: boolean;
}

interface QuestionDistributionProps {
  questionNumber: number;
  questionText: string;
  options: OptionStat[];
  totalStudents: number;
  correctAnswer: string;
}

export function QuestionDistributionChart({
  questionNumber,
  questionText,
  options,
  totalStudents,
  correctAnswer,
}: QuestionDistributionProps) {
  // Calculate counts and percentages
  const optionsWithStats = options.map(opt => {
    const count = Math.round(opt.propEndorsing * totalStudents);
    const percentage = (opt.propEndorsing * 100).toFixed(1);
    return {
      ...opt,
      count,
      percentage: parseFloat(percentage),
    };
  });

  // Find max percentage for scaling bars
  const maxPercentage = Math.max(...optionsWithStats.map(o => o.percentage));
  const totalAnswered = optionsWithStats.reduce((sum, opt) => sum + opt.count, 0);

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-base font-bold text-slate-800 mb-1">
              Soal No. {questionNumber}
            </CardTitle>
            <p className="text-sm text-slate-600 line-clamp-2">{questionText}</p>
          </div>
          <Badge className="bg-emerald-600 text-white shrink-0">
            Kunci: {correctAnswer}
          </Badge>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {totalAnswered} / {totalStudents} jawaban yang benar
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {optionsWithStats.map((opt) => {
            const barWidth = maxPercentage > 0 ? (opt.percentage / maxPercentage) * 100 : 0;
            const isCorrect = opt.option === correctAnswer;
            
            return (
              <div key={opt.option} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {isCorrect && '✓ '}
                      {opt.option}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {opt.count} ({opt.percentage}%)
                  </span>
                </div>
                
                <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      isCorrect
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : 'bg-gradient-to-r from-slate-300 to-slate-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  >
                    <div className="h-full flex items-center justify-end pr-3">
                      {opt.percentage > 5 && (
                        <span className={`text-xs font-bold ${isCorrect ? 'text-white' : 'text-slate-700'}`}>
                          {opt.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
