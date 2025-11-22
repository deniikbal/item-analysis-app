import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analisis Butir Soal',
  description: 'Aplikasi untuk analisis tingkat kesukaran dan daya pembeda butir soal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
