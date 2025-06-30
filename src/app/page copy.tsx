"use client";

import React, { useState, useRef } from "react";

export default function Home() {
  const [jobUrl, setJobUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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
    setError("");
    if (!jobUrl || !resumeFile) {
      setError("Please provide both a job URL and a resume file.");
      return;
    }
    setIsSubmitting(true);
    // 模拟API请求，展示Demo
    setTimeout(() => {
      setShowDemo(true);
      setIsSubmitting(false);
    }, 1000);
    // 实际API请求可替换下方注释
    // const formData = new FormData();
    // formData.append("jobUrl", jobUrl);
    // formData.append("resume", resumeFile);
    // try {
    //   const res = await fetch("/api/compare", {
    //     method: "POST",
    //     body: formData,
    //   });
    //   if (!res.ok) throw new Error("Failed to compare resume.");
    //   setShowDemo(true);
    // } catch (err) {
    //   setError("Failed to submit. Please try again.");
    // } finally {
    //   setIsSubmitting(false);
    // }
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
      <div className="w-full flex flex-col items-center justify-center bg-white/80 rounded-2xl shadow-lg p-4 sm:p-8 max-w-4xl mx-auto relative z-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-700 mb-2 text-center drop-shadow-md">
          MatchWise
        </h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-blue-600 mb-4 text-center">
          Tailor Your Resume & Cover Letter with AI
        </h2>
        <p className="text-base text-gray-600 mb-8 text-center max-w-xl">
          An AI-Powered Resume Comparison Platform (RCP), provide you intelligent job application assistant by optimize your resume & Cover letter for specific job posting.
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
              onChange={e => setJobUrl(e.target.value)}
              placeholder="https://example.com/job-posting"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div
            className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
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
              {resumeFile && (
                <span className="text-green-600 text-sm mt-2">{resumeFile.name}</span>
              )}
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Generating..." : "Generate comparison"}
          </button>
        </form>
        {showDemo && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 mt-8 border border-blue-100 flex flex-col gap-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis Results</h2>
            {/* Job Summary */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-blue-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Job Summary</span>
              </div>
              <p className="text-gray-700 text-base ml-5">This position requires a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies. The role involves leading development teams, architecting scalable solutions, and collaborating with cross-functional teams to deliver high-quality software products.</p>
            </div>
            {/* Match Score */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-green-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Match Score</span>
              </div>
              <div className="flex items-center ml-5 mb-2">
                <span className="text-3xl font-bold text-green-600 mr-4">78%</span>
                <div className="flex-1 h-3 bg-gray-200 rounded">
                  <div className="h-3 bg-green-500 rounded" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
            {/* Revised Resume Summary */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-purple-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Revised Resume Summary</span>
              </div>
              <p className="text-gray-700 text-base ml-5">Experienced software engineer with 6 years of expertise in full-stack development using React, Node.js, and cloud platforms. Demonstrated leadership in technical projects and team collaboration. Strong background in scalable architecture and modern development practices.</p>
            </div>
            {/* Tailored Work Experience */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-orange-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Tailored Work Experience</span>
              </div>
              <ul className="list-disc list-inside text-gray-700 text-base ml-5 space-y-1">
                <li>Led development of enterprise-level React applications serving 100K+ users, improving performance by 40%</li>
                <li>Architected and implemented microservices using Node.js and Docker, reducing deployment time by 60%</li>
                <li>Collaborated with cross-functional teams to deliver 15+ features on time and within budget</li>
                <li>Mentored junior developers and conducted code reviews, improving team productivity by 25%</li>
                <li>Implemented CI/CD pipelines using AWS services, reducing manual deployment errors by 90%</li>
              </ul>
            </div>
            {/* Custom Cover Letter */}
            <div>
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-7 bg-teal-500 rounded mr-3"></div>
                <span className="text-lg font-semibold text-gray-800">Custom Cover Letter</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 ml-5">
                <p className="text-gray-700 text-base mb-2">Dear Hiring Manager,</p>
                <p className="text-gray-700 text-base mb-2">I am excited to apply for the Senior Software Engineer position at your company. With over 6 years of experience in full-stack development and a proven track record of leading successful projects, I am confident in my ability to contribute significantly to your team.</p>
                <p className="text-gray-700 text-base mb-2">My experience with React, Node.js, and cloud technologies aligns perfectly with your requirements. I have successfully led development teams, architected scalable solutions, and delivered high-quality software products that have served thousands of users.</p>
                <p className="text-gray-700 text-base">I am particularly drawn to your company&apos;s innovative approach to software development and the opportunity to work with cutting-edge technologies. I am eager to bring my technical expertise and leadership skills to your organization.</p>
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
