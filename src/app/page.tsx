import { redirect } from 'next/navigation';

/**
 * Root page redirects to /quiz
 */
export default function Home() {
  redirect('/quiz');
}
