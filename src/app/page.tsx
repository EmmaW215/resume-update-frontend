/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useRef } from 'react';
import SimpleVisitorCounter from './components/SimpleVisitorCounter';


interface ComparisonResponse {
  job_summary: string;
  resume_summary: string;
  match_score: number;
  tailored_resume_summary: string;
  tailored_work_experience: string[];
  cover_letter: string;
}

export default function Home() {
  const [jobText, setJobText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ComparisonResponse | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobText || !resumeFile) {
      alert('Please provide both job description and resume.');
      return;
    }

    const formData = new FormData();
    formData.append('job_text', jobText); // 改为 job_text
    formData.append('resume', resumeFile);

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-matcher-backend-rrrw.onrender.com';
      const response = await fetch(`${BACKEND_URL}/api/compare`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch comparison');
      }
      const data = await response.json();
      setResponse(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      if (errorMessage.includes('xAI API error: 403')) {
        setError('Unable to process due to insufficient xAI API credits. Please contact support.');
      } else if (errorMessage.includes('Failed to fetch job posting')) {
        setError('The job posting URL is not accessible. Try a LinkedIn or company career page URL.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4 relative"
      style={{
        backgroundImage: "url('/Job_Search_Pic.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-white" style={{ opacity: 0.7 }} aria-hidden="true"></div>
      
      {/* Visitor Counter - Updated */}
      <div className="absolute top-4 right-4 z-20">
        <SimpleVisitorCounter />
      </div>
      
      {/* Admin Link */}
      <div className="absolute top-4 left-4 z-20">
        <a
          href="/admin/visitor-stats"
          className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
        >
          Admin
        </a>
      </div>
      
      <div className="w-full flex flex-col items-center justify-center bg-white/80 rounded-2xl shadow-lg p-4 sm:p-8 max-w-4xl mx-auto relative z-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-700 mb-2 text-center drop-shadow-md">
          MatchWise
        </h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-blue-600 mb-4 text-center">
          Tailor Your Resume & Cover Letter with AI
        </h2>
        <p className="text-base text-gray-600 mb-8 text-center max-w-xl">
          An AI-Powered Resume Comparison Platform (RCP), providing intelligent job application assistance by optimizing your resume & cover letter for specific job postings.
        </p>

        <form
          className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6 border border-gray-100"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="jobText" className="block text-sm font-semibold font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              id="jobText"
              required
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Please paste the full job description here"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div
            className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <input
              id="resume"
              type="file"
              accept=".pdf,.doc,.docx"
              required
              ref={inputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-gray-700 font-medium">Upload Resume (PDF or DOCX)</span>
              <span className="text-xs text-gray-400">Drag & drop or click to select file</span>
              {resumeFile && <span className="text-green-600 text-sm mt-2">{resumeFile.name}</span>}
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {loading && <div className="text-blue-600 text-sm text-center">Processing your request...</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Comparison'}
          </button>
        </form>

        {response && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 mt-8 border border-blue-100 flex flex-col gap-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis Results</h2>

            {/* Job Requirement Summary */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-blue-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Job Requirement Summary</span>
              </div>
              <div className="ml-5"
                dangerouslySetInnerHTML={{ __html: response.job_summary || 'No job summary available.' }}
              />
            </div>

            {/* Resume - Job Posting Comparison */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-purple-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Resume - Job Posting Comparison</span>
              </div>
              <div className="ml-5">
                   <div className="resume-table-html"
                     dangerouslySetInnerHTML={{ __html: response.resume_summary }}
                   />
              </div>
            </div>

            {/* Match Score */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-green-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Match Score</span>
              </div>
              <div className="flex items-center ml-5 mb-2">
                <span className="text-3xl font-bold text-green-600 mr-4">{response.match_score || 0}%</span>
                <div className="flex-1 h-3 bg-gray-200 rounded">
                  <div
                    className="h-3 bg-green-500 rounded"
                    style={{ width: `${response.match_score || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tailored Resume Summary */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-purple-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Tailored Resume Summary</span>
              </div>
              <div className="ml-5"
                dangerouslySetInnerHTML={{ __html: response.tailored_resume_summary || 'No tailored resume summary available.' }}
              />
            </div>

            {/* Tailored Resume Work Experience */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-orange-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Tailored Resume Work Experience</span>
              </div>
              <div className="ml-5"
                dangerouslySetInnerHTML={{ __html: response.tailored_work_experience || '<ul><li>No tailored work experience provided.</li></ul>' }}
              />
            </div>

            {/* Cover Letter */}
            <div>
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-teal-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Cover Letter</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 ml-5"
                dangerouslySetInnerHTML={{ __html: response.cover_letter || 'No cover letter available.' }}
              />
            </div>
          </div>
        )}

        <footer className="mt-10 text-gray-400 text-xs text-center">
          © {new Date().getFullYear()} MatchWise. All rights reserved.
        </footer>
      </div>
    </div>
  );
}