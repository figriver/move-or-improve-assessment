'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ScoreResult, Category } from '@/types';

interface ResultsData {
  result: ScoreResult;
  categories: Category[];
}

export default function ResultsPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(`/api/results/${params.sessionId}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [params.sessionId]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await axios.get(`/api/results/${params.sessionId}/pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `move-improve-results-${params.sessionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (error || !data) {
    return (
      <div className="error-container">
        <div className="error">{error || 'No results found'}</div>
        <button onClick={() => router.push('/quiz')} className="button">
          Start New Assessment
        </button>
      </div>
    );
  }

  const { result, categories } = data;
  const decisionClass = result.decision.toLowerCase();
  const leanClass = result.leanStrength.toLowerCase();

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Your Assessment Results</h1>
        <p className="results-subtitle">Based on your answers across {result.metadata?.questionsAnswered || 0} questions</p>
      </div>

      {/* Main Decision Card */}
      <div className={`decision-card decision-${decisionClass}`}>
        <div className="decision-content">
          <h2 className="decision-title">{result.decision}</h2>
          <p className="decision-subtitle">
            {result.decision === 'Improve'
              ? 'The data suggests improving your current situation'
              : result.decision === 'Move'
              ? 'The data suggests moving to a new situation'
              : 'The data is unclear - consider both options'}
          </p>
          <p className="lean-strength">
            Lean Strength: <strong>{result.leanStrength}</strong>
          </p>
        </div>
      </div>

      {/* Composite Scores */}
      <div className="scores-section">
        <h3>Composite Scores</h3>
        <div className="scores-grid">
          <div className="score-card">
            <h4>Improve Score</h4>
            <div className="score-value">{result.improveComposite.toFixed(2)}</div>
            <div className="score-bar">
              <div
                className="score-fill improve-fill"
                style={{ width: `${Math.min(result.improveComposite * 20, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="score-card">
            <h4>Move Score</h4>
            <div className="score-value">{result.moveComposite.toFixed(2)}</div>
            <div className="score-bar">
              <div
                className="score-fill move-fill"
                style={{ width: `${Math.min(result.moveComposite * 20, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="score-card">
            <h4>Decision Index</h4>
            <div className="score-value">{result.decisionIndex.toFixed(2)}</div>
            <div className="score-bar">
              <div
                className={`score-fill ${result.decisionIndex > 0 ? 'improve-fill' : 'move-fill'}`}
                style={{ width: `${Math.min(Math.abs(result.decisionIndex) * 20, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="categories-section">
        <h3>Category Breakdown</h3>
        <div className="categories-grid">
          {categories.map((category) => {
            const score = result.categoryBreakdown[category.id];
            if (!score) return null;

            const categoryDecision = score.improve > score.move ? 'Improve' : score.move > score.improve ? 'Move' : 'Neutral';
            const diff = Math.abs(score.improve - score.move);

            return (
              <div key={category.id} className="category-card">
                <h4>{category.label}</h4>
                <p className="category-description">{category.description}</p>
                <div className="category-scores">
                  <div className="mini-score">
                    <span>Improve:</span>
                    <strong>{score.improve.toFixed(2)}</strong>
                  </div>
                  <div className="mini-score">
                    <span>Move:</span>
                    <strong>{score.move.toFixed(2)}</strong>
                  </div>
                </div>
                <div className="category-decision">
                  Leans {categoryDecision} ({diff.toFixed(2)})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Methodology */}
      <div className="methodology-section">
        <h3>Assessment Methodology</h3>
        <p>This assessment uses a weighted scoring system across multiple categories:</p>
        <ul>
          <li>Each question is scored on a normalized scale</li>
          <li>Category scores are calculated as weighted averages</li>
          <li>Composite scores weight categories based on their importance</li>
          <li>The decision is based on the difference between Improve and Move scores</li>
          <li>Lean strength indicates the confidence of the recommendation</li>
        </ul>
        <p className="metadata">
          Assessment ID: <code>{params.sessionId}</code>
        </p>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="button button-primary"
        >
          {downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
        <button
          onClick={() => router.push('/quiz')}
          className="button button-secondary"
        >
          Start New Assessment
        </button>
      </div>
    </div>
  );
}
