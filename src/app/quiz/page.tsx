'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function QuizStart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/quiz/start');
      const { sessionId } = res.data;
      router.push(`/quiz/${sessionId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start quiz');
      setLoading(false);
    }
  };

  return (
    <div className="quiz-start-container">
      <div className="quiz-start-card">
        <h1 className="quiz-title">Move vs Improve Assessment</h1>
        <p className="quiz-subtitle">
          An objective, transparent assessment tool to help you decide:
        </p>
        <p className="quiz-subtitle-bold">Should you improve your current situation or move?</p>

        <div className="quiz-features">
          <div className="feature">
            <span className="feature-icon">✓</span>
            <span>Objective scoring across multiple categories</span>
          </div>
          <div className="feature">
            <span className="feature-icon">✓</span>
            <span>Transparent methodology with detailed breakdown</span>
          </div>
          <div className="feature">
            <span className="feature-icon">✓</span>
            <span>Customizable questions and thresholds</span>
          </div>
          <div className="feature">
            <span className="feature-icon">✓</span>
            <span>Downloadable PDF report</span>
          </div>
        </div>

        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="start-button"
        >
          {loading ? 'Starting...' : 'Start Assessment'}
        </button>

        <p className="quiz-notice">
          Takes about 10-15 minutes to complete
        </p>
      </div>
    </div>
  );
}
