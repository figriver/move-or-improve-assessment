'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="error-container">
      <h1>Something went wrong</h1>
      <p>{error.message || 'An unexpected error occurred'}</p>
      <button onClick={() => reset()} className="button button-primary">
        Try again
      </button>
    </div>
  );
}
