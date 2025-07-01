'use client';

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-matcher-backend-rrrw.onrender.com';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.target as HTMLFormElement);
    try {
      const response = await fetch(`${BACKEND_URL}/api/compare`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch comparison');
      }
      const data = await response.json();
      setComparisonResult(data);
    } catch (err: any) {
      if (err.message.includes('xAI API error: 403')) {
        setError('Unable to process due to insufficient xAI API credits. Please contact support.');
      } else if (err.message.includes('Failed to fetch job posting')) {
        setError('The job posting URL is not accessible. Try a LinkedIn or company career page URL.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Resume Comparison Platform</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="job_url" placeholder="Job Posting URL" required />
        <input type="file" name="resume" accept=".pdf,.doc,.docx" required />
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Comparison'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {comparisonResult && (
        <div>
          <h2>Job Summary</h2>
          <p>{comparisonResult.job_summary}</p>
          <h2>Resume Summary</h2>
          <p>{comparisonResult.resume_summary}</p>
          <h2>Match Score</h2>
          <p>{comparisonResult.match_score}%</p>
          <h2>Tailored Resume Summary</h2>
          <p>{comparisonResult.tailored_resume_summary}</p>
          <h2>Tailored Work Experience</h2>
          <ul>
            {comparisonResult.tailored_work_experience.map((exp: string, index: number) => (
              <li key={index}>{exp}</li>
            ))}
          </ul>
          <h2>Cover Letter</h2>
          <p>{comparisonResult.cover_letter}</p>
        </div>
      )}
    </div>
  );
}