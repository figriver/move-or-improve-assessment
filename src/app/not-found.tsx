import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-container">
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/quiz" className="button button-primary">
        Back to Quiz
      </Link>
    </div>
  );
}
