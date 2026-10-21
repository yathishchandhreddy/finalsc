import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { AboutVSBModal } from './components/AboutVSBModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ChatMessage, ChatSession, PenguinState, VoiceStatus } from './types';
import {
  speakText,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  isVoiceEnabled,
  setVoiceEnabled,
} from './utils/speech';
import { generateClientCollegeResponse } from './utils/collegeKnowledge';

const SESSIONS_STORAGE_KEY = 'vsb_chat_sessions_v1';
const CURRENT_SESSION_KEY = 'vsb_current_session_id';

function createNewSessionObject(title: string = 'New Conversation'): ChatSession {
  const id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  return {
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [penguinState, setPenguinState] = useState<PenguinState>('greeting');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Separate, accurate status tracking
  const [isVoiceOn, setIsVoiceOn] = useState<boolean>(isVoiceEnabled());
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(isVoiceEnabled() ? 'ready' : 'off');
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);

  // Modals
  const [aboutOpen, setAboutOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const happyTimerRef = useRef<any>(null);

  // Initialize sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const savedCurrentId = localStorage.getItem(CURRENT_SESSION_KEY);

      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          const active = parsed.find((s) => s.id === savedCurrentId) || parsed[0];
          setCurrentSessionId(active.id);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not restore sessions from storage:', e);
    }

    // Default first session
    const firstSession = createNewSessionObject('Welcome to VSB College');
    setSessions([firstSession]);
    setCurrentSessionId(firstSession.id);
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
        localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
      } catch (e) {
        console.warn('Could not persist sessions:', e);
      }
    }
  }, [sessions, currentSessionId]);

  // Initial welcome greeting transitions smoothly to idle
  useEffect(() => {
    const timer = setTimeout(() => {
      setPenguinState('idle');
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  const handleNewChat = () => {
    stopSpeech();
    setActiveSpeakingMsgId(null);
    setVoiceStatus(isVoiceOn ? 'ready' : 'off');

    const newSession = createNewSessionObject('New Conversation');
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setPenguinState('greeting');
    setTimeout(() => setPenguinState('idle'), 2500);
  };

  const handleSelectSession = (id: string) => {
    stopSpeech();
    setActiveSpeakingMsgId(null);
    setVoiceStatus(isVoiceOn ? 'ready' : 'off');

    setCurrentSessionId(id);
    setPenguinState('idle');
  };

  const handleDeleteSession = (id: string) => {
    stopSpeech();
    setActiveSpeakingMsgId(null);
    setVoiceStatus(isVoiceOn ? 'ready' : 'off');

    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSessionObject('New Conversation');
        setCurrentSessionId(fresh.id);
        return [fresh];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Toggle global voice synthesis preference
  const handleToggleVoice = () => {
    const next = !isVoiceOn;
    setIsVoiceOn(next);
    setVoiceEnabled(next);

    if (!next) {
      stopSpeech();
      setActiveSpeakingMsgId(null);
      setVoiceStatus('off');
      if (penguinState === 'speaking') {
        setPenguinState('idle');
      }
    } else {
      setVoiceStatus('ready');
    }
  };

  // Pause / Resume ongoing speech
  const handlePauseResumeSpeech = () => {
    if (voiceStatus === 'paused') {
      resumeSpeech();
      setVoiceStatus('speaking');
      setPenguinState('speaking');
    } else if (voiceStatus === 'speaking') {
      pauseSpeech();
      setVoiceStatus('paused');
      // Set to an attentive paused posture
      setPenguinState('listening');
    }
  };

  // Stop active speech playback
  const handleStopSpeech = () => {
    stopSpeech();
    setActiveSpeakingMsgId(null);
    setVoiceStatus(isVoiceOn ? 'stopped' : 'off');
    setPenguinState('idle');
    setTimeout(() => {
      setVoiceStatus(isVoiceOn ? 'ready' : 'off');
    }, 800);
  };

  // Main chat message submission handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (happyTimerRef.current) {
      clearTimeout(happyTimerRef.current);
    }

    // 1. Immediately halt previous speech when a new question is submitted
    stopSpeech();
    setActiveSpeakingMsgId(null);
    setVoiceStatus(isVoiceOn ? 'ready' : 'off');

    // 2. Set mascot to LISTENING briefly
    setPenguinState('listening');

    const userMessage: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update session title if first message
    const updatedTitle =
      messages.length === 0
        ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
        : currentSession.title;

    // Append user message immediately
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: updatedTitle,
            updatedAt: new Date().toISOString(),
            messages: [...s.messages, userMessage],
          };
        }
        return s;
      })
    );

    setIsLoading(true);

    // 3. Switch to THINKING state while AI generates response
    setTimeout(() => {
      setPenguinState('thinking');
    }, 400);

    // Abort controller for network cancellation
    abortControllerRef.current = new AbortController();

    let answerText = '';
    let answerSources: { documentName: string; relevanceScore: number }[] = [];
    let answerState: PenguinState = 'speaking';

    try {
      let isSuccess = false;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: text,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: abortControllerRef.current.signal,
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data && data.answer) {
            answerText = data.answer;
            answerSources = data.sources || [];
            answerState = (data.penguinState as PenguinState) || 'speaking';
            isSuccess = true;
          }
        }
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          console.log('Query aborted by student');
          setVoiceStatus(isVoiceOn ? 'ready' : 'off');
          setPenguinState('idle');
          setIsLoading(false);
          return;
        }
        console.warn('Backend API unreachable or non-JSON returned, utilizing institutional knowledge base:', fetchErr);
      }

      // If backend was not reached or returned non-JSON (such as Vercel 404 HTML), use verified college knowledge
      if (!isSuccess || !answerText) {
        const fallback = generateClientCollegeResponse(text, messages);
        answerText = fallback.answer;
        answerSources = fallback.sources;
        answerState = fallback.penguinState;
      }

      const assistantMsgId = 'msg_asst_' + Date.now();
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: answerSources,
        state: answerState,
      };

      // 4. Display response in the chat
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, assistantMessage],
            };
          }
          return s;
        })
      );

      // 5. Automatic response reaction
      if (isVoiceOn) {
        setActiveSpeakingMsgId(assistantMsgId);
        setVoiceStatus('speaking');
        setPenguinState(answerState === 'error' ? 'error' : 'speaking');

        speakText(answerText, {
          onStart: () => {
            setVoiceStatus('speaking');
            setPenguinState('speaking');
          },
          onPause: () => {
            setVoiceStatus('paused');
            setPenguinState('listening');
          },
          onResume: () => {
            setVoiceStatus('speaking');
            setPenguinState('speaking');
          },
          onEnd: () => {
            setVoiceStatus('ready');
            setActiveSpeakingMsgId(null);
            // 6. Brief celebratory HAPPY movement, then IDLE
            setPenguinState('happy');
            happyTimerRef.current = setTimeout(() => {
              setPenguinState('idle');
            }, 1800);
          },
          onError: () => {
            setVoiceStatus('ready');
            setActiveSpeakingMsgId(null);
            setPenguinState('idle');
          },
        });
      } else {
        // Voice is OFF: visual answer-received celebration, then return to IDLE
        setVoiceStatus('off');
        setPenguinState(answerState === 'error' ? 'error' : 'happy');
        happyTimerRef.current = setTimeout(() => {
          setPenguinState('idle');
        }, 1600);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Query aborted by user');
        setVoiceStatus(isVoiceOn ? 'ready' : 'off');
        setPenguinState('idle');
      } else {
        console.error('Chat query error:', err);
        const errorMessage: ChatMessage = {
          id: 'msg_err_' + Date.now(),
          role: 'assistant',
          content: `We encountered a temporary connection issue. Please try asking again or contact the VSB College admission desk at +91 4324 290141.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          state: 'error',
        };

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                messages: [...s.messages, errorMessage],
              };
            }
            return s;
          })
        );

        setVoiceStatus(isVoiceOn ? 'ready' : 'off');
        setPenguinState('error');
        setTimeout(() => {
          setPenguinState('idle');
        }, 2500);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopSpeech();
    setActiveSpeakingMsgId(null);
    setVoiceStatus(isVoiceOn ? 'stopped' : 'off');
    setIsLoading(false);
    setPenguinState('idle');
    setTimeout(() => {
      setVoiceStatus(isVoiceOn ? 'ready' : 'off');
    }, 800);
  };

  // Play individual message when user clicks speak on it
  const handlePlayMessage = (msg: ChatMessage) => {
    if (activeSpeakingMsgId === msg.id && voiceStatus === 'speaking') {
      pauseSpeech();
      setVoiceStatus('paused');
      setPenguinState('listening');
      return;
    }

    if (activeSpeakingMsgId === msg.id && voiceStatus === 'paused') {
      resumeSpeech();
      setVoiceStatus('speaking');
      setPenguinState('speaking');
      return;
    }

    stopSpeech();
    setActiveSpeakingMsgId(msg.id);
    setVoiceStatus('speaking');
    setPenguinState('speaking');

    speakText(msg.content, {
      onStart: () => {
        setVoiceStatus('speaking');
        setPenguinState('speaking');
      },
      onPause: () => {
        setVoiceStatus('paused');
        setPenguinState('listening');
      },
      onResume: () => {
        setVoiceStatus('speaking');
        setPenguinState('speaking');
      },
      onEnd: () => {
        setVoiceStatus('ready');
        setActiveSpeakingMsgId(null);
        setPenguinState('happy');
        setTimeout(() => setPenguinState('idle'), 1600);
      },
      onError: () => {
        setVoiceStatus('ready');
        setActiveSpeakingMsgId(null);
        setPenguinState('idle');
      },
    });
  };

  return (
    <div className="flex h-screen w-screen bg-white text-slate-900 overflow-hidden font-sans">
      {/* VSB Sidebar with History, FAQs, Admin & About triggers */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onSelectFaqPrompt={(prompt) => handleSendMessage(prompt)}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Conversation & Assistant Two-Column Layout */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <ChatArea
          messages={messages}
          penguinState={penguinState}
          voiceStatus={voiceStatus}
          onPenguinStateChange={(st) => setPenguinState(st)}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStop}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSelectPrompt={(prompt) => handleSendMessage(prompt)}
          // Speech Controls & States
          isVoiceOn={isVoiceOn}
          onToggleVoice={handleToggleVoice}
          activeSpeakingMsgId={activeSpeakingMsgId}
          onPauseResumeSpeech={handlePauseResumeSpeech}
          onStopSpeech={handleStopSpeech}
          onPlayMessage={handlePlayMessage}
        />
      </main>

      {/* About VSB College Modal */}
      <AboutVSBModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
      />

      {/* Admin Panel Modal (Document Knowledge Base & Custom 3D Model GLB) */}
      <AdminPanelModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onDocumentsUpdated={() => {
          console.log('College knowledge base documents updated.');
        }}
      />
    </div>
  );
}
