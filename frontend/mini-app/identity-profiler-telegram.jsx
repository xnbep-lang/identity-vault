import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Brain, Clock, ChevronDown, Send } from 'lucide-react';

// Initialize Telegram Web App
const tg = window?.Telegram?.WebApp;

export default function IdentityProfiler() {
  const [userProfile, setUserProfile] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('welcome'); // welcome, question, profile, verify
  const [verificationScore, setVerificationScore] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [token, setToken] = useState(null);
  const [currentProfileId, setCurrentProfileId] = useState(null);
  const [user, setUser] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Initialize Telegram Web App
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      
      // Get user info from Telegram
      const telegramUser = tg.initData?.user;
      if (telegramUser) {
        setUser({
          telegramId: telegramUser.id,
          firstName: telegramUser.first_name,
          username: telegramUser.username
        });
      }

      // Dark theme setup
      tg.setBackgroundColor('#0f172a');
      tg.setHeaderColor('#0f172a');
    }
  }, []);

  // Register or login user
  useEffect(() => {
    if (user && !token) {
      registerUser();
    }
  }, [user]);

  const registerUser = async () => {
    try {
      // Try to register with Telegram ID
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user.telegramId,
          username: `tg_${user.telegramId}`,
          password: `secure_${user.telegramId}_${Date.now()}`
        })
      });

      const data = await response.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('vault_token', data.token);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  // Generate question using API
  const generateQuestion = async (existingAnswers) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          existing_answers: existingAnswers
        })
      });

      const data = await response.json();
      setCurrentQuestion({
        text: data.question,
        optionA: data.optionA,
        optionB: data.optionB
      });
    } catch (error) {
      console.error('Error generating question:', error);
      // Fallback
      setCurrentQuestion({
        text: 'Do you prefer cities or wilderness?',
        optionA: 'Cities',
        optionB: 'Wilderness'
      });
    }
    setLoading(false);
  };

  // Analyze profile with API
  const analyzeProfile = async (profileId, allAnswers) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/profiles/${profileId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setUserProfile(data.profile);

      // Notify Telegram bot of profile completion
      if (tg?.sendData) {
        tg.sendData(JSON.stringify({
          event: 'profile_analyzed',
          profile: data.profile,
          profileId
        }));
      }
    } catch (error) {
      console.error('Error analyzing profile:', error);
      setUserProfile({
        archetype: 'The Seeker',
        traits: ['Independent', 'Thoughtful', 'Distinctive'],
        patterns: 'Your answers reveal a unique pattern of preferences.',
        riskFactors: ['Emerging pattern'],
        strengthScore: 50
      });
    }
    setLoading(false);
  };

  // Verify identity
  const verifyIdentity = async (profileId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/profiles/${profileId}/verification-challenge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      setVerificationScore({
        question: data.challenge.question,
        expectedKeywords: data.challenge.expectedKeywords,
        status: 'pending',
        userAnswer: ''
      });
    } catch (error) {
      console.error('Error generating verification:', error);
    }
    setLoading(false);
  };

  // Start session
  const startSession = async () => {
    if (!token) {
      console.error('No token available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/profiles/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setCurrentProfileId(data.profileId);
      setAnswers([]);
      setPhase('question');
      generateQuestion([]);

      // Notify bot
      if (tg?.sendData) {
        tg.sendData(JSON.stringify({
          event: 'profile_created',
          profileId: data.profileId,
          sessionNumber: data.sessionNumber
        }));
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
    setLoading(false);
  };

  // Answer question
  const answerQuestion = async (choice) => {
    if (!currentProfileId) return;

    setLoading(true);
    try {
      // Store answer via API
      await fetch(`${API_URL}/api/profiles/${currentProfileId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: currentQuestion.text,
          answer: choice,
          question_order: answers.length + 1
        })
      });

      const newAnswer = {
        question: currentQuestion.text,
        answer: choice,
        timestamp: new Date().toLocaleTimeString()
      };

      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      if (updatedAnswers.length >= 5) {
        // Analyze after 5 questions
        await analyzeProfile(currentProfileId, updatedAnswers);
        setPhase('profile');
      } else {
        // Generate next question
        generateQuestion(updatedAnswers);
      }
    } catch (error) {
      console.error('Error storing answer:', error);
    }
    setLoading(false);
  };

  // Check verification answer
  const checkVerification = async (userAnswer) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/profiles/${currentProfileId}/verify-answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            question: verificationScore.question,
            userAnswer,
            expectedKeywords: verificationScore.expectedKeywords
          })
        }
      );

      const data = await response.json();
      setVerificationScore({
        ...verificationScore,
        status: data.verified ? 'verified' : 'failed'
      });

      // Notify bot
      if (tg?.sendData) {
        tg.sendData(JSON.stringify({
          event: data.verified ? 'verification_success' : 'verification_failed',
          confidence: data.confidence
        }));
      }
    } catch (error) {
      console.error('Error verifying:', error);
      setVerificationScore({
        ...verificationScore,
        status: 'failed'
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 text-white font-sans overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto p-6 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 mt-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Identity Vault</h1>
            <p className="text-xs text-slate-300">
              {user ? `@${user.username || user.firstName}` : 'Telegram Connected'}
            </p>
          </div>
        </div>

        {/* Welcome Phase */}
        {phase === 'welcome' && (
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Know Yourself,<br/>Secure Yourself</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Answer simple preference questions to build your unique identity profile. Over time, your answers create an unforgeable fingerprint that only you can replicate.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-blue-950 border border-blue-700 rounded-lg">
                <Shield size={20} className="text-blue-400 flex-shrink-0" />
                <p className="text-xs text-slate-300">Powered by Telegram & AI</p>
              </div>
              <div className="flex gap-3 p-3 bg-blue-950 border border-blue-700 rounded-lg">
                <Clock size={20} className="text-blue-400 flex-shrink-0" />
                <p className="text-xs text-slate-300">~2 min to build your first profile</p>
              </div>
            </div>

            <button
              onClick={startSession}
              disabled={!token || loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              Begin <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Question Phase */}
        {phase === 'question' && currentQuestion && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs text-blue-400 font-semibold">QUESTION {answers.length + 1}/5</p>
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${((answers.length + 1) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4">
                <h2 className="text-2xl font-bold leading-tight">{currentQuestion.text}</h2>
              </div>
            </div>

            <div className="space-y-3 pb-6">
              <button
                onClick={() => answerQuestion(currentQuestion.optionA)}
                disabled={loading}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-blue-500 rounded-lg text-left transition-all disabled:opacity-50"
              >
                <p className="font-semibold">{currentQuestion.optionA}</p>
              </button>
              <button
                onClick={() => answerQuestion(currentQuestion.optionB)}
                disabled={loading}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-blue-500 rounded-lg text-left transition-all disabled:opacity-50"
              >
                <p className="font-semibold">{currentQuestion.optionB}</p>
              </button>
            </div>
          </div>
        )}

        {/* Profile Phase */}
        {phase === 'profile' && userProfile && (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div>
                <p className="text-xs text-blue-400 font-semibold mb-2">YOUR IDENTITY PROFILE</p>
                <h2 className="text-2xl font-bold">{userProfile.archetype}</h2>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">Traits Detected</h3>
                <div className="flex flex-wrap gap-2">
                  {userProfile.traits.map(trait => (
                    <span key={trait} className="px-3 py-1 bg-blue-900 border border-blue-700 rounded-full text-xs">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">Identity Pattern</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{userProfile.patterns}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-300">Box Strength</h3>
                  <span className="text-2xl font-bold text-blue-400">{userProfile.strengthScore}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      userProfile.strengthScore > 70
                        ? 'bg-green-500'
                        : userProfile.strengthScore > 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${userProfile.strengthScore}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-between text-sm"
              >
                <span>View Answers</span>
                <ChevronDown size={16} className={showStats ? 'rotate-180' : ''} />
              </button>

              {showStats && (
                <div className="space-y-2 p-3 bg-slate-800 rounded-lg max-h-48 overflow-y-auto">
                  {answers.map((answer, i) => (
                    <div key={i} className="text-xs">
                      <p className="text-slate-400">{answer.question}</p>
                      <p className="text-blue-400 font-semibold">→ {answer.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pb-6">
              <button
                onClick={() => { setPhase('verify'); verifyIdentity(currentProfileId); }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 py-3 rounded-lg font-semibold transition-all"
              >
                Test Vault Access
              </button>
              <button
                onClick={startSession}
                className="w-full py-3 rounded-lg font-semibold border border-slate-600 hover:border-slate-500 transition-all"
              >
                New Session
              </button>
            </div>
          </div>
        )}

        {/* Verify Phase */}
        {phase === 'verify' && verificationScore && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <p className="text-xs text-blue-400 font-semibold mb-2">IDENTITY VERIFICATION</p>
                <h2 className="text-xl font-bold">Prove it's you</h2>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
                <p className="text-lg font-semibold">{verificationScore.question}?</p>

                {verificationScore.status === 'pending' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Your answer..."
                      value={verificationScore.userAnswer || ''}
                      onChange={(e) =>
                        setVerificationScore({
                          ...verificationScore,
                          userAnswer: e.target.value
                        })
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          checkVerification(verificationScore.userAnswer);
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => checkVerification(verificationScore.userAnswer)}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}

                {verificationScore.status === 'verified' && (
                  <div className="p-3 bg-green-900 border border-green-700 rounded text-green-200 text-sm">
                    ✓ Identity verified. Vault unlocked.
                  </div>
                )}

                {verificationScore.status === 'failed' && (
                  <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
                    ✗ Verification failed. Try again or answer more questions.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={startSession}
              className="w-full py-3 rounded-lg font-semibold border border-slate-600 hover:border-slate-500 transition-all"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
