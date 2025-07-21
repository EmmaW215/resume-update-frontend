/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../firebase";

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

interface UserStatus {
  trialUsed: boolean;
  isUpgraded: boolean;
  planType: string | null;
  scanLimit: number | null;
  scansUsed: number;
  lastScanMonth: string;
}

export default function Home() {
  const [jobText, setJobText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ComparisonResponse | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userStatusLoading, setUserStatusLoading] = useState(false);
  
  // 用户状态
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  
  // 匿名用户试用状态（仅用于未登录用户）
  const [anonymousTrialUsed, setAnonymousTrialUsed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化时检查匿名用户试用状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const trialUsed = localStorage.getItem('anonymousTrialUsed') === 'true';
      setAnonymousTrialUsed(trialUsed);
    }
  }, []);

  // 监听用户登录状态
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // 页面加载或用户变化时清除错误状态
  useEffect(() => {
    setError('');
    setShowUpgradeModal(false);
  }, [user]);

  // 获取用户状态
  useEffect(() => {
    if (user) {
      console.log('🔄 Loading user status for:', user.uid);
      setUserStatusLoading(true);
      fetch(`/api/user/status?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          console.log('📊 User status response:', data);
          if (data.error) {
            console.error('❌ Error fetching user status:', data.error);
            setUserStatus(null);
          } else {
            setUserStatus(data);
          }
        })
        .catch((error) => {
          console.error('❌ Failed to fetch user status:', error);
          setUserStatus(null);
        })
        .finally(() => {
          console.log('✅ User status loading completed');
          setUserStatusLoading(false);
        });
    } else {
      console.log('👤 No user, clearing status');
      setUserStatus(null);
      setUserStatusLoading(false);
    }
  }, [user]);

  // 检查用户是否可以生成分析
  const canGenerate = () => {
    if (!user) {
      // 匿名用户：检查本地试用状态
      return !anonymousTrialUsed;
    }
    
    if (!userStatus) {
      return true; // 状态未加载完成时，允许尝试生成
    }
    
    // 登录用户：检查试用和订阅状态
    if (!userStatus.trialUsed) {
      return true; // 试用可用
    }
    
    if (userStatus.isUpgraded) {
      if (userStatus.scanLimit === null) {
        return true; // 无限制
      }
      return userStatus.scansUsed < userStatus.scanLimit; // 检查剩余次数
    }
    
    return false; // 试用已用且未升级
  };

  // 获取错误信息
  const getErrorMessage = () => {
    if (!user) {
      if (anonymousTrialUsed) {
        return 'Your free trial is finished. Please sign in and upgrade to continue using MatchWise!';
      }
      return '';
    }
    
    if (!userStatus) {
      return 'Loading user status...';
    }
    
    if (userStatus.trialUsed && !userStatus.isUpgraded) {
      return 'Your free trial is finished. Please upgrade to continue using MatchWise!';
    }
    
    if (userStatus.isUpgraded && userStatus.scanLimit !== null && userStatus.scansUsed >= userStatus.scanLimit) {
      return 'You have reached your monthly scan limit. Please upgrade your plan or wait for next month.';
    }
    
    return '';
  };

  // 检查是否应该显示升级提示（只在用户尝试生成后显示）
  const shouldShowUpgradePrompt = () => {
    // 只有在有错误信息且包含"upgrade"关键词时才显示
    const errorMsg = getErrorMessage();
    return errorMsg.includes('upgrade') || errorMsg.includes('limit');
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (!jobText || !resumeFile) {
      alert('Please provide both job description and resume.');
      return;
    }

    // 清除之前的错误信息
    setError('');

    // 检查是否可以生成
    if (!canGenerate()) {
      const errorMsg = getErrorMessage();
      setResponse(null);
      setError(errorMsg);
      return; // 只显示错误消息，不自动弹出支付窗口
    }

    const formData = new FormData();
    formData.append('job_text', jobText);
    formData.append('resume', resumeFile);
    if (user) {
      formData.append('uid', user.uid);
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

      // 更新状态
      if (!user) {
        // 匿名用户：标记试用已使用
        localStorage.setItem('anonymousTrialUsed', 'true');
        setAnonymousTrialUsed(true);
        console.log('✅ Anonymous user trial marked as used');
      } else {
        // 登录用户：标记试用已使用并刷新状态
        try {
          // 首先标记试用已使用
          const trialResponse = await fetch(`/api/user/use-trial?uid=${user.uid}`, { 
            method: "POST" 
          });
          if (trialResponse.ok) {
            console.log('✅ Logged-in user trial marked as used');
          }
          
          // 然后刷新用户状态
          const statusResponse = await fetch(`/api/user/status?uid=${user.uid}`);
          const statusData = await statusResponse.json();
          if (!statusData.error) {
            setUserStatus(statusData);
            console.log('✅ User status refreshed:', statusData);
          }
        } catch (error) {
          console.error('❌ Error updating trial status:', error);
        }
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

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  async function handleUpgradeOneTime() {
    if (!user) {
      alert('Please sign in before upgrading.');
      return;
    }
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-matcher-backend-rrrw.onrender.com';
    const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ uid: user.uid, price_id: 'price_1RnBbcE6OOEHr6Zo6igE1U8B', mode: 'payment' })
    });
    const data = await res.json();
    if (data.checkout_url) {
      window.open(data.checkout_url, '_blank');
    } else {
      alert('Failed to create checkout session');
    }
  }

  async function handleUpgradeSubscription_6() {
    if (!user) {
      alert('Please sign in before upgrading.');
      return;
    }
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-matcher-backend-rrrw.onrender.com';
    const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ uid: user.uid, price_id: 'price_1RnBehE6OOEHr6Zo4QLLJZTg', mode: 'payment' })
    });
    const data = await res.json();
    if (data.checkout_url) {
      window.open(data.checkout_url, '_blank');
    } else {
      alert('Failed to create checkout session');
    }
  }

  async function handleUpgradeSubscription_15() {
    if (!user) {
      alert('Please sign in before upgrading.');
      return;
    }
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-matcher-backend-rrrw.onrender.com';
    const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ uid: user.uid, price_id: 'price_1RnBgPE6OOEHr6Zo9EFmgyA5', mode: 'subscription' })
    });
    const data = await res.json();
    if (data.checkout_url) {
      window.open(data.checkout_url, '_blank');
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
        
        {/* Visitor Counter */}
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
            
            {/* Debug info - remove this in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                Debug: loading={loading.toString()}, user={user ? 'yes' : 'no'}, 
                userStatusLoading={userStatusLoading.toString()}, 
                canGenerate={canGenerate().toString()}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || (user ? userStatusLoading : false)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Comparison'}
            </button>
          </form>
          
          {/* Show remaining usage for upgraded users */}
          {user && userStatus && userStatus.isUpgraded && userStatus.scanLimit !== null && !userStatusLoading && (
            <div className="mb-2 text-center text-blue-700 font-semibold">
              Remaining this month: {Math.max(userStatus.scanLimit - userStatus.scansUsed, 0)} times
            </div>
          )}

          {/* Show upgrade prompts only when there's an error */}
          {error && shouldShowUpgradePrompt() && (
            <div className="mb-4 text-center">
              <div className="text-red-600 font-semibold mb-2">
                {error}
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    // 如果用户未登录，先提示登录
                    alert('Please sign in before upgrading.');
                    return;
                  }
                  setShowUpgradeModal(true);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition"
              >
                {!user ? 'Sign in & Upgrade' : 'Upgrade to continue using MatchWise'}
              </button>
            </div>
          )}

          {/* Show analysis results */}
          {response && (
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="relative bg-white/50 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center"
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
                <div className="text-lg font-semibold text-gray-800 mb-2">Option 2: Subscription_6</div>
                <div className="text-green-600 font-bold text-xl mb-2">$6/month</div>
                <div className="text-gray-600 text-sm mb-4">Subscribe for up to 30 scans per month</div>
                <button
                  onClick={handleUpgradeSubscription_6}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow transition"
                >
                  Subscribe $6/month
                </button>
              </div>
              <div className="bg-white/90 rounded-lg shadow p-4 flex flex-col items-center">
                <div className="text-lg font-semibold text-gray-800 mb-2">Option 3: Subscription_15</div>
                <div className="text-green-600 font-bold text-xl mb-2">$15/month</div>
                <div className="text-gray-600 text-sm mb-4">Subscribe for up to 180 scans per month</div>
                <button
                  onClick={handleUpgradeSubscription_15}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow transition"
                >
                  Subscribe $15/month
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}