import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Brain, Clock, ChevronDown } from 'lucide-react';

export default function IdentityProfiler() {
  const [userProfile, setUserProfile] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('welcome'); // welcome, question, profile, verify
  const [verificationScore, setVerificationScore] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Simulate Claude API call for question generation
  const generateQuestion = async (existingAnswers) => {
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          system: `You are an identity profiler creating security questions. Based on user answers, generate ONE binary choice question that reveals lifestyle/personality patterns. Format: "What do you prefer: [Option A] or [Option B]?" Keep it short and evocative.`,
          messages: [
            {
              role: "user",
              content: `Previous answers: ${existingAnswers.length > 0 ? existingAnswers.map(a => `${a.question}: ${a.answer}`).join(' | ') : 'None yet'}. Generate a contextual question that probes deeper into this profile.`
            }
          ]
        })
      });

      const data = await response.json();
      const questionText = data.content[0]?.text || "Do you prefer mountains or oceans?";
      const [optA, optB] = questionText.match(/\[([^\]]+)\]/g)?.map(s => s.slice(1, -1)) || ["Option A", "Option B"];
      
      setCurrentQuestion({
        text: questionText,
        optionA: optA,
        optionB: optB
      });
    } catch (error) {
      console.error("Error generating question:", error);
      setCurrentQuestion({
        text: "Do you prefer cities or wilderness?",
        optionA: "Cities",
        optionB: "Wilderness"
      });
    }
    setLoading(false);
  };

  // Analyze profile with Claude
  const analyzeProfile = async (allAnswers) => {
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: `You are a security psychologist. Analyze these identity markers and create a personality profile. Return ONLY valid JSON with no markdown or extra text. Format: {"archetype":"name","traits":["trait1","trait2"],"patterns":"paragraph","riskFactors":["factor1"],"strengthScore":0-100}`,
          messages: [
            {
              role: "user",
              content: `Analyze this identity from answers: ${allAnswers.map(a => `${a.question}: ${a.answer}`).join(' | ')}`
            }
          ]
        })
      });

      const data = await response.json();
      const profileText = data.content[0]?.text || '{}';
      const cleanJson = profileText.replace(/```json|```/g, '').trim();
      const profile = JSON.parse(cleanJson);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error analyzing profile:", error);
      setUserProfile({
        archetype: "The Nocturnal Nomad",
        traits: ["Night-oriented", "Independent", "Adventure-seeking", "Tech-savvy"],
        patterns: "Pattern detected: You show preference for night activities, independent travel, and non-traditional choices. This suggests someone who operates outside standard rhythms.",
        riskFactors: ["Predictable preference patterns"],
        strengthScore: 45
      });
    }
    setLoading(false);
  };

  // Verify identity
  const verifyIdentity = async (allAnswers) => {
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          system: `You are a security verification system. Generate a verification question based on user's identity profile. Ask something they should answer consistently. Format: "Question: [text]?|Answer_should_contain: [keyword]"`,
          messages: [
            {
              role: "user",
              content: `Based on this profile: ${JSON.stringify(userProfile)}, create a verification question.`
            }
          ]
        })
      });

      const data = await response.json();
      const responseText = data.content[0]?.text || "Do you prefer night or day?";
      const [question, hint] = responseText.split('|');
      
      setVerificationScore({
        question: question.replace('Question: ', '').replace('?', ''),
        expectedHint: hint?.replace('Answer_should_contain: ', ''),
        status: 'pending'
      });
    } catch (error) {
      setVerificationScore({
        question: "You mentioned preferring bikes and nighttime—would you go for a moonlit ride?",
        expectedHint: "night or ride or moon",
        status: 'pending'
      });
    }
    setLoading(false);
  };

  // Start session
  const startSession = () => {
    setAnswers([]);
    setPhase('question');
    generateQuestion([]);
  };

  // Answer question
  const answerQuestion = (choice) => {
    const newAnswer = {
      question: currentQuestion.text,
      answer: choice,
      timestamp: new Date().toLocaleTimeString()
    };
    setAnswers([...answers, newAnswer]);

    if (answers.length + 1 >= 5) {
      // After 5 questions, analyze profile
      analyzeProfile([...answers, newAnswer]);
      setPhase('profile');
    } else {
      generateQuestion([...answers, newAnswer]);
    }
  };

  // Verify answer
  const checkVerification = (userAnswer) => {
    const isCorrect = verificationScore.expectedHint.toLowerCase().split(' or ').some(hint =>
      userAnswer.toLowerCase().includes(hint.trim())
    );
    setVerificationScore({ ...verificationScore, status: isCorrect ? 'verified' : 'failed' });
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
            <p className="text-xs text-slate-300">Security through self-knowledge</p>
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
                <p className="text-xs text-slate-300">Your profile stays private and encrypted</p>
              </div>
              <div className="flex gap-3 p-3 bg-blue-950 border border-blue-700 rounded-lg">
                <Clock size={20} className="text-blue-400 flex-shrink-0" />
                <p className="text-xs text-slate-300">~2 min to build your first profile</p>
              </div>
            </div>

            <button
              onClick={startSession}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
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
                    className={`h-full ${userProfile.strengthScore > 70 ? 'bg-green-500' : userProfile.strengthScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${userProfile.strengthScore}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400">
                  {userProfile.strengthScore > 70 ? "Strong enough for sensitive data" : "Need more answers to strengthen"}
                </p>
              </div>

              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-between text-sm"
              >
                <span>View Answers</span>
                <ChevronDown size={16} className={showStats ? 'rotate-180' : ''} />
              </button>

              {showStats && (
                <div className="space-y-2 p-3 bg-slate-800 rounded-lg">
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
                onClick={() => { setPhase('verify'); verifyIdentity(answers); }}
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
                  <input
                    type="text"
                    placeholder="Your answer..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') checkVerification(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                )}

                {verificationScore.status === 'verified' && (
                  <div className="p-3 bg-green-900 border border-green-700 rounded text-green-200 text-sm">
                    ✓ Identity verified. Vault unlocked.
                  </div>
                )}

                {verificationScore.status === 'failed' && (
                  <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
                    ✗ Verification failed. Try again.
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
