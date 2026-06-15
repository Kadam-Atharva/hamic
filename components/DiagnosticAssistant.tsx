'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Wrench, Send, AlertTriangle, CheckCircle, HelpCircle, 
  RefreshCw, Play, ShieldAlert, Cpu, Check, X, ShieldCheck, Loader2
} from 'lucide-react';

interface DiagnosticAssistantProps {
  productId: string;
  productCategory: string;
}

export default function DiagnosticAssistant({ productId, productCategory }: DiagnosticAssistantProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [symptomTracker, setSymptomTracker] = useState<any[]>([]);
  const [ruledOutCauses, setRuledOutCauses] = useState<string[]>([]);
  const [suspectedCauses, setSuspectedCauses] = useState<any[]>([]);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'resolved' | 'unresolved' | 'idle'>('idle');
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [recommendedParts, setRecommendedParts] = useState<any[]>([]);

  // Fetch spare parts semantically via Moss whenever suspected causes update
  useEffect(() => {
    if (suspectedCauses.length > 0) {
      const topCause = suspectedCauses[0].cause;
      fetch(`/api/parts?query=${encodeURIComponent(topCause)}&category=${encodeURIComponent(productCategory)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setRecommendedParts(data.parts || []);
          }
        })
        .catch(err => console.error('Failed to fetch recommended parts:', err));
    } else {
      setRecommendedParts([]);
    }
  }, [suspectedCauses, productCategory]);

  // Suggested symptoms based on product category
  const getSuggestions = () => {
    const cat = productCategory.toLowerCase();
    if (cat.includes('ac') || cat.includes('air conditioner')) {
      return ['AC is blowing hot air', 'AC does not turn on', 'Ice forming on the coils', 'Strange humming noise'];
    }
    if (cat.includes('wash') || cat.includes('washer')) {
      return ['Drum is not spinning', 'Washing machine leaking water', 'Stops mid-cycle', 'Displaying an error code'];
    }
    return ['Device is not turning on', 'Device is overheating', 'Strange sound during operation', 'Controls are unresponsive'];
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start a new diagnostic session
  const startSession = async (symptomStr: string) => {
    if (!symptomStr.trim()) return;
    setLoading(true);
    setSessionStatus('active');
    
    // Add initial user message locally first
    setMessages([{ role: 'user', content: symptomStr, timestamp: new Date().toISOString() }]);

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, symptom: symptomStr })
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.session._id);
        setMessages(data.session.chatHistory);
        setSymptomTracker(data.session.symptomTracker || []);
        setRuledOutCauses(data.session.ruledOutCauses || []);
        setSuspectedCauses(data.session.suspectedCauses || []);
        setSessionStatus(data.session.status);
      }
    } catch (err) {
      console.error('Failed to start session', err);
    } finally {
      setLoading(false);
    }
  };

  // Send message or quick reply
  const sendMessage = async (text: string) => {
    if (!text.trim() || !sessionId) return;
    setLoading(true);

    // Append user message locally
    const updatedMessages = [...messages, { role: 'user', content: text, timestamp: new Date().toISOString() }];
    setMessages(updatedMessages);
    setInputText('');

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, sessionId, message: text })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.session.chatHistory);
        setSymptomTracker(data.session.symptomTracker || []);
        setRuledOutCauses(data.session.ruledOutCauses || []);
        setSuspectedCauses(data.session.suspectedCauses || []);
        setSessionStatus(data.session.status);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset Session
  const resetSession = () => {
    setSessionId(null);
    setMessages([]);
    setSymptomTracker([]);
    setRuledOutCauses([]);
    setSuspectedCauses([]);
    setRecommendedParts([]);
    setSessionStatus('idle');
    setInputText('');
  };

  // Get active probability color
  const getProbColor = (prob: number) => {
    if (prob >= 80) return 'bg-red-500';
    if (prob >= 50) return 'bg-orange-500';
    return 'bg-cyan-500';
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Chat Section (Left/Center) */}
      <div className="lg:col-span-2 flex flex-col rounded-2xl bg-zinc-900/40 border border-zinc-900 h-[600px] overflow-hidden">
        {/* Chat Header */}
        <div className="border-b border-zinc-900 bg-zinc-900/60 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Diagnostic Assistant</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">AI Assistant Mode</p>
            </div>
          </div>
          {sessionStatus !== 'idle' && (
            <button
              onClick={resetSession}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Diagnosis
            </button>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {sessionStatus === 'idle' ? (
            /* Idle Screen / Start Screen */
            <div className="h-full flex flex-col justify-center items-center text-center px-4 max-w-lg mx-auto">
              <div className="h-14 w-14 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 glow-cyan">
                <Wrench className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Let's Diagnose the Issue</h4>
              <p className="text-zinc-400 text-sm mt-2">
                Explain the symptoms you are observing. The assistant will analyze the product manuals and systematically eliminate causes.
              </p>

              {/* Suggestions */}
              <div className="mt-8 w-full">
                <p className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Common Symptoms</p>
                <div className="flex flex-col gap-2">
                  {getSuggestions().map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => startSession(suggestion)}
                      className="text-left w-full rounded-xl bg-zinc-950/60 border border-zinc-900 hover:border-cyan-500/40 p-3 text-xs text-zinc-300 hover:text-white transition-all hover:bg-zinc-950"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="mt-6 w-full flex items-center gap-2 border-t border-zinc-900 pt-6">
                <input
                  type="text"
                  placeholder="Describe your custom issue..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startSession(inputText)}
                  className="flex-1 rounded-xl bg-zinc-950 border border-zinc-900 px-4 py-3 text-xs text-white outline-none focus:border-cyan-500/40"
                />
                <button
                  onClick={() => startSession(inputText)}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-600 text-zinc-950 p-3 transition-all font-semibold text-xs flex items-center justify-center"
                >
                  <Play className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Message Feed */
            <>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-cyan-500 text-zinc-950 font-medium rounded-tr-none'
                        : 'bg-zinc-950 border border-zinc-900 text-zinc-200 rounded-tl-none'
                    }`}
                  >
                    {m.content.split('\n').map((line: string, lIdx: number) => (
                      <p key={lIdx} className={lIdx > 0 ? 'mt-2' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-xs text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    <span>Analyzing symptom tree...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Chat Actions Input (Only if session is active) */}
        {sessionStatus === 'active' && !loading && (
          <div className="border-t border-zinc-900 bg-zinc-900/20 p-4 space-y-4">
            {/* Quick reply buttons (Yes/No/Unsure) */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => sendMessage('Yes')}
                className="flex-1 rounded-xl bg-zinc-950/80 border border-zinc-850 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 py-2.5 text-xs font-bold transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => sendMessage('No')}
                className="flex-1 rounded-xl bg-zinc-950/80 border border-zinc-850 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 py-2.5 text-xs font-bold transition-all"
              >
                No
              </button>
              <button
                onClick={() => sendMessage('Not sure')}
                className="flex-1 rounded-xl bg-zinc-950/80 border border-zinc-850 text-zinc-400 hover:bg-zinc-900 py-2.5 text-xs font-bold transition-all"
              >
                Not sure / Skip
              </button>
            </div>

            {/* Manual text input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
                className="flex-1 rounded-xl bg-zinc-950 border border-zinc-900 px-4 py-3 text-xs text-white outline-none focus:border-cyan-500/40"
              />
              <button
                onClick={() => sendMessage(inputText)}
                className="rounded-xl bg-cyan-500 hover:bg-cyan-600 text-zinc-950 p-3 transition-all font-semibold"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Resolved screen actions */}
        {(sessionStatus === 'resolved' || sessionStatus === 'unresolved') && (
          <div className="border-t border-zinc-900 bg-zinc-950/80 p-5 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 mb-2">
              {sessionStatus === 'resolved' ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              )}
            </div>
            <p className="text-xs text-zinc-400 font-semibold mb-3">
              {sessionStatus === 'resolved' 
                ? 'Diagnosis Complete: A solution was proposed.' 
                : 'Diagnostics finished, but unable to resolve the exact cause.'}
            </p>
            <button
              onClick={resetSession}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-5 py-2.5 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/10"
            >
              Start New Diagnosis
            </button>
          </div>
        )}
      </div>

      {/* Diagnostic Dashboard Panel (Right - WOW Element) */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-5 flex flex-col gap-6">
        <div>
          <h3 className="font-bold text-white text-base">Diagnostic Dashboard</h3>
          <p className="text-xs text-zinc-550 mt-0.5">Real-time status of the troubleshooting investigation.</p>
        </div>

        {/* Status Indicator */}
        <div className="rounded-xl bg-zinc-950 border border-zinc-900 p-4 flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">Session Status</span>
          <div className="flex items-center gap-2 font-bold text-xs">
            {sessionStatus === 'idle' && (
              <span className="text-zinc-500">STANDBY</span>
            )}
            {sessionStatus === 'active' && (
              <span className="text-cyan-400 flex items-center gap-1.5 status-pulse after:h-2 after:w-2 after:bg-cyan-400">
                INVESTIGATING
              </span>
            )}
            {sessionStatus === 'resolved' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                RESOLVED
              </span>
            )}
            {sessionStatus === 'unresolved' && (
              <span className="text-yellow-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                UNRESOLVED
              </span>
            )}
          </div>
        </div>

        {/* Suspected Causes (Probability list) */}
        <div>
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Suspected Root Causes</h4>
          {sessionStatus === 'idle' || suspectedCauses.length === 0 ? (
            <p className="text-xs text-zinc-650 italic py-2">Waiting for symptoms...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {suspectedCauses.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-zinc-350">{item.cause}</span>
                    <span className="text-zinc-500">{item.probability}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProbColor(item.probability)}`} 
                      style={{ width: `${item.probability}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-zinc-900" />

        {/* Ruled Out Causes */}
        <div>
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Ruled Out Causes</h4>
          {sessionStatus === 'idle' || ruledOutCauses.length === 0 ? (
            <p className="text-xs text-zinc-650 italic py-2">None eliminated yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {ruledOutCauses.map((cause, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-zinc-550 line-through">
                  <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  <span>{cause}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-zinc-900" />

        {/* Confirmed Symptoms checklist */}
        <div>
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Confirmed Symptoms</h4>
          {sessionStatus === 'idle' || symptomTracker.length === 0 ? (
            <p className="text-xs text-zinc-650 italic py-2">No symptoms documented.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
              {symptomTracker.map((tracker, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  {tracker.status === 'confirmed' ? (
                    <div className="rounded-full bg-emerald-500/10 text-emerald-400 p-0.5 shrink-0 mt-0.5 border border-emerald-500/20">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : tracker.status === 'denied' ? (
                    <div className="rounded-full bg-red-500/10 text-red-400 p-0.5 shrink-0 mt-0.5 border border-red-500/20">
                      <X className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="rounded-full bg-cyan-500/10 text-cyan-400 p-0.5 shrink-0 mt-0.5 border border-cyan-500/20">
                      <HelpCircle className="h-3 w-3" />
                    </div>
                  )}
                  <span className={`text-zinc-350 ${tracker.status === 'denied' ? 'text-zinc-600' : ''}`}>
                    {tracker.symptom}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Spare Parts & Tools (Moss Semantic Search) */}
        {recommendedParts.length > 0 && (
          <>
            <hr className="border-zinc-900" />
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-cyan-400" />
                Required Parts & Tools
              </h4>
              <div className="flex flex-col gap-2">
                {recommendedParts.map((part, idx) => (
                  <Link
                    key={idx}
                    href={`/marketplace?search=${encodeURIComponent(part.name)}`}
                    className="rounded-xl bg-zinc-950/80 border border-zinc-900 p-2.5 flex items-center justify-between text-xs hover:border-cyan-500/30 hover:bg-zinc-900 transition-all group/part"
                  >
                    <div>
                      <span className="font-semibold text-zinc-200 block group-hover/part:text-cyan-400 transition-colors">{part.name}</span>
                      <span className="text-[10px] text-zinc-500">{part.type} • Relevancy: {(part.score * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-cyan-400 font-bold group-hover/part:underline">{part.price}</span>
                  </Link>
                ))}
              </div>
              <p className="text-[9px] text-zinc-600 mt-2 italic text-right">Powered by Moss Search</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
