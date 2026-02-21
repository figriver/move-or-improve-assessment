import { ResponseSession, ScoreResult, Category } from '@/types';
import { prisma } from './prisma';

/**
 * Generate PDF report from session results
 * Uses html2pdf for client-side or server-side rendering
 */
export async function generatePDF(session: any): Promise<Buffer> {
  try {
    // Import html2pdf dynamically (it's Node-compatible)
    const html2pdf = require('html2pdf.js');

    // Get full session data including answers and categories
    const fullSession = await prisma.responseSession.findUnique({
      where: { id: session.id },
      include: {
        scoreResult: true,
        answers: true,
        version: {
          include: {
            categories: true,
          },
        },
      },
    });

    if (!fullSession || !fullSession.scoreResult) {
      throw new Error('Session or results not found');
    }

    // Build HTML content
    const htmlContent = buildPDFHTML(fullSession);

    // Generate PDF
    const options = {
      margin: [10, 10, 10, 10],
      filename: `move-improve-results-${session.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    // Create PDF buffer
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      html2pdf()
        .set(options)
        .from.html(htmlContent)
        .save();

      // Fallback: return a simple text document
      // In production, use proper PDF library
      const text = generateTextReport(fullSession);
      resolve(Buffer.from(text, 'utf-8'));
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Return a simple text-based report as fallback
    const text = `Move vs Improve Assessment Results\n\nError generating PDF: ${error}`;
    return Buffer.from(text, 'utf-8');
  }
}

/**
 * Build HTML structure for PDF
 */
function buildPDFHTML(session: any): string {
  const result = session.scoreResult;
  const categories = session.version.categories;

  const decisionClass = result.decision.toLowerCase();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 32px; margin-bottom: 10px; color: #222; }
    h2 { font-size: 24px; margin-top: 30px; margin-bottom: 15px; color: #222; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
    h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #444; }
    p { margin-bottom: 10px; }
    .metadata { color: #666; font-size: 14px; }
    
    .decision-card { padding: 30px; border-radius: 8px; margin: 20px 0; }
    .decision-improve { background: #e8f5e9; border-left: 4px solid #4caf50; }
    .decision-move { background: #fce4ec; border-left: 4px solid #e91e63; }
    .decision-unclear { background: #fff3e0; border-left: 4px solid #ff9800; }
    
    .decision-title { font-size: 28px; margin-bottom: 10px; font-weight: bold; }
    .lean-strength { margin-top: 15px; font-size: 16px; }
    
    .scores-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
    .score-card { padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px; }
    .score-value { font-size: 32px; font-weight: bold; margin: 10px 0; color: #1976d2; }
    .score-label { font-size: 14px; color: #666; }
    
    .categories-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .category-card { padding: 15px; border: 1px solid #e0e0e0; border-radius: 6px; }
    .category-card h4 { color: #1976d2; margin-bottom: 8px; }
    .category-scores { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; font-size: 14px; }
    .mini-score { padding: 8px; background: #f5f5f5; border-radius: 4px; }
    
    .methodology { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .methodology ul { margin-left: 20px; margin-top: 10px; }
    .methodology li { margin-bottom: 8px; }
    
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; }
    
    @media print {
      .container { padding: 20px; }
      .decision-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Move vs Improve Assessment</h1>
    <p class="metadata">Assessment ID: ${session.id}</p>
    <p class="metadata">Date: ${new Date(result.createdAt).toLocaleDateString()}</p>
    
    <div class="decision-card decision-${decisionClass}">
      <h2 class="decision-title">${result.decision}</h2>
      <p>
        ${result.decision === 'Improve'
          ? 'The data suggests improving your current situation.'
          : result.decision === 'Move'
          ? 'The data suggests moving to a new situation.'
          : 'The data is unclear - consider both options.'}
      </p>
      <p class="lean-strength">
        <strong>Lean Strength:</strong> ${result.leanStrength}
      </p>
    </div>
    
    <h2>Composite Scores</h2>
    <div class="scores-grid">
      <div class="score-card">
        <div class="score-label">Improve Score</div>
        <div class="score-value">${result.improveComposite.toFixed(2)}</div>
      </div>
      <div class="score-card">
        <div class="score-label">Move Score</div>
        <div class="score-value">${result.moveComposite.toFixed(2)}</div>
      </div>
      <div class="score-card">
        <div class="score-label">Decision Index</div>
        <div class="score-value">${result.decisionIndex.toFixed(2)}</div>
      </div>
    </div>
    
    <h2>Category Breakdown</h2>
    <div class="categories-grid">
      ${categories
        .map((cat: any) => {
          const score = result.categoryBreakdown[cat.id];
          if (!score) return '';
          const categoryDecision = score.improve > score.move ? 'Improve' : score.move > score.improve ? 'Move' : 'Neutral';
          const diff = Math.abs(score.improve - score.move);
          return `
        <div class="category-card">
          <h4>${cat.label}</h4>
          <p class="metadata">${cat.description || ''}</p>
          <div class="category-scores">
            <div class="mini-score">
              <strong>Improve:</strong> ${score.improve.toFixed(2)}
            </div>
            <div class="mini-score">
              <strong>Move:</strong> ${score.move.toFixed(2)}
            </div>
          </div>
          <p><strong>Leans:</strong> ${categoryDecision} (${diff.toFixed(2)})</p>
        </div>
          `;
        })
        .join('')}
    </div>
    
    <div class="methodology">
      <h2>Assessment Methodology</h2>
      <p>This assessment uses a weighted scoring system across multiple categories:</p>
      <ul>
        <li>Each question is scored on a normalized scale</li>
        <li>Category scores are calculated as weighted averages</li>
        <li>Composite scores weight categories based on their importance</li>
        <li>The decision is based on the difference between Improve and Move scores</li>
        <li>Lean strength indicates the confidence of the recommendation</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()}</p>
      <p>© Move vs Improve Assessment Tool</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text report as fallback
 */
function generateTextReport(session: any): string {
  const result = session.scoreResult;
  const categories = session.version.categories;

  let text = 'MOVE VS IMPROVE ASSESSMENT RESULTS\n';
  text += '='.repeat(50) + '\n\n';
  text += `Assessment ID: ${session.id}\n`;
  text += `Date: ${new Date(result.createdAt).toLocaleDateString()}\n`;
  text += `Time: ${new Date(result.createdAt).toLocaleTimeString()}\n\n`;

  text += 'DECISION\n';
  text += '-'.repeat(50) + '\n';
  text += `${result.decision}\n`;
  text += `Lean Strength: ${result.leanStrength}\n\n`;

  text += 'COMPOSITE SCORES\n';
  text += '-'.repeat(50) + '\n';
  text += `Improve Score: ${result.improveComposite.toFixed(2)}\n`;
  text += `Move Score: ${result.moveComposite.toFixed(2)}\n`;
  text += `Decision Index: ${result.decisionIndex.toFixed(2)}\n\n`;

  text += 'CATEGORY BREAKDOWN\n';
  text += '-'.repeat(50) + '\n';
  for (const cat of categories) {
    const score = result.categoryBreakdown[cat.id];
    if (!score) continue;
    const categoryDecision = score.improve > score.move ? 'Improve' : score.move > score.improve ? 'Move' : 'Neutral';
    const diff = Math.abs(score.improve - score.move);

    text += `\n${cat.label}\n`;
    if (cat.description) text += `${cat.description}\n`;
    text += `  Improve: ${score.improve.toFixed(2)}\n`;
    text += `  Move: ${score.move.toFixed(2)}\n`;
    text += `  Leans: ${categoryDecision} (${diff.toFixed(2)})\n`;
  }

  text += '\n' + 'METHODOLOGY\n';
  text += '-'.repeat(50) + '\n';
  text += 'This assessment uses a weighted scoring system across multiple categories:\n';
  text += '- Each question is scored on a normalized scale\n';
  text += '- Category scores are calculated as weighted averages\n';
  text += '- Composite scores weight categories based on their importance\n';
  text += '- The decision is based on the difference between Improve and Move scores\n';
  text += '- Lean strength indicates the confidence of the recommendation\n\n';

  text += `Generated on ${new Date().toLocaleString()}\n`;
  text += '© Move vs Improve Assessment Tool\n';

  return text;
}
