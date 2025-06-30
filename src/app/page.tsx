"use client";

import React, { useState, useRef } from "react";

export default function Home() {
  const [jobUrl, setJobUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null); // For backend response
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setError("");
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
      setError("");
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobUrl || !resumeFile) {
      alert("Please provide both job URL and resume.");
      return;
    }

    const formData = new FormData();
    formData.append("job_url", jobUrl);
    formData.append("resume", resumeFile);

    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://resume-matcher-backend-f7nx.onrender.com/api/compare", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Backend error: ${errorText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setError(`Failed to fetch comparison: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4 relative"
      style={{
        backgroundImage: "url('/Job_Search_Pic.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-white" style={{ opacity: 0.7 }} aria-hidden="true"></div>
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
            <label htmlFor="jobUrl" className="block text-sm font-semibold font-medium text-gray-700 mb-1">
              Job Posting URL
            </label>
            <input
              id="jobUrl"
              type="url"
              required
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://example.com/job-posting"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div
            className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
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
            {loading ? "Generating..." : "Generate Comparison"}
          </button>
        </form>

        {response && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 mt-8 border border-blue-100 flex flex-col gap-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis Results</h2>

            {/* Job Summary */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-blue-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Job Summary</span>
              </div>
              <p className="text-gray-700 text-base ml-5">{response.job_summary || "No job summary available."}</p>
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

            {/* Revised Resume Summary */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-purple-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Revised Resume Summary</span>
              </div>
              <p className="text-gray-700 text-base ml-5">{response.resume_summary || "No resume summary available."}</p>
            </div>

            {/* Tailored Work Experience */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-orange-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Tailored Work Experience</span>
              </div>
              <ul className="list-disc list-inside text-gray-700 text-base ml-5 space-y-1">
                {response.work_experience && response.work_experience.length > 0 ? (
                  response.work_experience.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))
                ) : (
                  <li>No work experience provided.</li>
                )}
              </ul>
            </div>

            {/* Custom Cover Letter */}
            <div>
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-teal-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Custom Cover Letter</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 ml-5">
                <p className="text-gray-700 text-base">{response.cover_letter || "No cover letter available."}</p>
              </div>
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