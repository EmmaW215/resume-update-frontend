'use client';

import { useState } from 'react';

interface ComparisonResponse {
  job_summary: string;
  match_score: number;
  resume_summary: string;
  work_experience: string[];
  cover_letter: string;
  resume_text: string;
  job_text: string;
}

export default function Home() {
  const [jobUrl, setJobUrl] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [result, setResult] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('job_url', jobUrl);
    if (resume) {
      formData.append('resume', resume);
    }

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-matcher-backend-rrrw.onrender.com';
      const res = await fetch(`${BACKEND_URL}/api/compare`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch comparison: ${res.statusText}`);
      }

      const data: ComparisonResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Resume Matcher</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700">
            Job Posting URL
          </label>
          <input
            type="url"
            id="jobUrl"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
            Upload Resume (PDF or DOCX)
          </label>
          <input
            type="file"
            id="resume"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : 'Generate Comparison'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {(loading || result) && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold">Resume Preview</h2>
            {loading && !result && (
              <p className="text-gray-500">Extracting resume text...</p>
            )}
            {result && (
              <pre className="mt-2 p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
                {result.resume_text || 'No resume text available'}
              </pre>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Job Description Preview</h2>
            {loading && !result && (
              <p className="text-gray-500">Extracting job description...</p>
            )}
            {result && (
              <pre className="mt-2 p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
                {result.job_text || 'No job description available'}
              </pre>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Comparison Results</h2>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Job Summary</h3>
              <p className="p-4 bg-gray-100 rounded-md">{result.job_summary}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Match Score</h3>
              <p className="p-4 bg-gray-100 rounded-md">{result.match_score}%</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Resume Summary</h3>
              <p className="p-4 bg-gray-100 rounded-md">{result.resume_summary}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Tailored Work Experience</h3>
              <ul className="list-disc pl-5 p-4 bg-gray-100 rounded-md">
                {result.work_experience.map((exp, index) => (
                  <li key={index}>{exp}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium">Custom Cover Letter</h3>
              <pre className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
                {result.cover_letter}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}