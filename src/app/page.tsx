/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../firebase"; // 路径根据实际情况调整

import SimpleVisitorCounter from './components/SimpleVisitorCounter';
import { loadStripe } from '@stripe/stripe-js';


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
  const [trialUsed, setTrialUsed] = useState<boolean>(false);
  const [selectedPriceId, setSelectedPriceId] = useState('price_2dollar_id');
  // 你需要把 price_2dollar_id, price_6dollar_id, price_15dollar_id 换成你 Stripe 后台实际的 price_id
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgraded, setIsUpgraded] = useState<boolean>(false);


  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setError('');
    }
  };

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    setUser(firebaseUser);
  });
  return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`/api/user/trial-status?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          setTrialUsed(data.trialUsed);
          setIsUpgraded(data.isUpgraded); // 新增
        })
        .catch(() => {
          setTrialUsed(false);
          setIsUpgraded(false);
        });
    } else {
      setTrialUsed(false);
      setIsUpgraded(false);
    }
  }, [user]);


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

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // 未登录用户，检查本地试用
    if (!user) {
      const trialUsedLocal = localStorage.getItem('trialUsed');
      if (trialUsedLocal === 'true') {
        setResponse(null);
        alert('You have used your free trial. Please sign in and upgrade to continue using MatchWise!');
        return; // 这里 return，绝不调用分析 API
      }
    }
  
    // 已登录用户，检查后端试用和升级状态
    if (user) {
      if (trialUsed && !isUpgraded) {
        setResponse(null);
        alert('You have used your free trial. Please upgrade to continue using MatchWise!');
        return; // 这里 return，绝不调用分析 API
      }
    }

    if (!jobText || !resumeFile) {
      alert('Please provide both job description and resume.');
      return;
    }

    const formData = new FormData();
    formData.append('job_text', jobText);
    formData.append('resume', resumeFile);
    if (user) {
      formData.append('uid', user.uid); // 新增：传递用户ID
    }

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

      if (!user) {
        localStorage.setItem('trialUsed', 'true');
      }
      if (user && !trialUsed) {
        await fetch(`${BACKEND_URL}/api/user/use-trial?uid=${user.uid}`, { method: "POST" })
          .then(() => setTrialUsed(true));
      }

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

  function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        // 登录成功，user 会自动更新
      })
      .catch((error) => {
        alert("login failed: " + error.message);
      });
  }
  
  function handleLogout() {
    signOut(auth);
  }

  const stripePromise = loadStripe('pk_test_51RlrH6CznoMxD717T9LzmtmVSbRwiKiKM1XXIEHFHbbhTM9WXumjxpvkWkwWDfsumqHt1A6mdaf2Be7Xisbfs7xQ005PuaKG2J');

  async function handleUpgradeOneTime() {
    if (!user) {
      alert('Please sign in before upgrading.');
      return;
    }
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-matcher-backend-rrrw.onrender.com';
    const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ uid: user.uid, price_id: 'price_1RlsdUCznoMxD717tAkMoRd9', mode: 'payment' })
    });
    const data = await res.json();
    if (data.checkout_url) {
      window.open(data.checkout_url, '_blank'); // 新标签页打开
    } else {
      alert('Failed to create checkout session');
    }
  }

  async function handleUpgradeSubscription() {
    if (!user) {
      alert('Please sign in before upgrading.');
      return;
    }
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-matcher-backend-rrrw.onrender.com';
    const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ uid: user.uid, price_id: 'price_1RlsgyCznoMxD7176oiZ540Z', mode: 'subscription' })
    });
    const data = await res.json();
    if (data.checkout_url) {
      window.open(data.checkout_url, '_blank'); // 新标签页打开
    } else {
      alert('Failed to create checkout session');
    }
  }


  return (
    
    <div>
      {!user ? (
        <button
          onClick={handleGoogleLogin}
          className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
        >
          Sign in with Google
        </button>
      ) : (
        <div className="mb-4 flex items-center gap-4">
          <span>Welcome, {user.displayName || user.email}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-gray-400 hover:bg-gray-600 text-white rounded"
          >
            Sign out
          </button>
        </div>
      )}

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
          
          
          {user && trialUsed && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition"
            >
              Upgrade to continue using MatchWise
            </button>
          )}

          {(response && (!user && !localStorage.getItem('trialUsed') || (user && !trialUsed))) && (
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8 mt-8 border border-blue-100 flex flex-col gap-8 animate-fade-in">
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

      {/* 升级套餐选择 Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="relative bg-white/90 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center"
            style={{
              backgroundImage: "url('/Job_Search_Pic.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid #e0e7ef',
            }}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowUpgradeModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Choose Your Plan</h2>
            <div className="w-full flex flex-col gap-6">
              <div className="bg-white/90 rounded-lg shadow p-4 flex flex-col items-center">
                <div className="text-lg font-semibold text-gray-800 mb-2">Option 1: One-time Generation</div>
                <div className="text-green-600 font-bold text-xl mb-2">$2</div>
                <div className="text-gray-600 text-sm mb-4">Pay $2 for a single resume analysis</div>
                <button
                  onClick={handleUpgradeOneTime}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
                >
                  Pay $2
                </button>
              </div>
              <div className="bg-white/90 rounded-lg shadow p-4 flex flex-col items-center">
                <div className="text-lg font-semibold text-gray-800 mb-2">Option 2: Subscription</div>
                <div className="text-green-600 font-bold text-xl mb-2">$6/month or $15/month</div>
                <div className="text-gray-600 text-sm mb-4">Subscribe for up to 30 to 180 scans per month. Choose your plan on the Stripe page.</div>
                <button
                  onClick={handleUpgradeSubscription}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow transition"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}