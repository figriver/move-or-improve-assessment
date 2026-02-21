import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz - Move vs Improve Assessment',
  description: 'Take the assessment',
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="quiz-layout">
      <main className="quiz-main">
        {children}
      </main>
    </div>
  );
}
