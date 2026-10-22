import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Copy,
  Check,
  Sparkles,
  Menu,
  Mic,
  MicOff,
  FileCheck2,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { ChatMessage, PenguinState, VoiceStatus } from '../types';
import { PenguinAssistant } from './PenguinAssistant';
import { VSBLogo } from './VSBLogo';

interface ChatAreaProps {
  messages: ChatMessage[];
  penguinState: PenguinState;
  voiceStatus: VoiceStatus;
  onPenguinStateChange: (state: PenguinState) => void;
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onStop: () => void;
  onToggleSidebar: () => void;
  onSelectPrompt: (prompt: string) => void;

  // Speech Props
  isVoiceOn: boolean;
  onToggleVoice: () => void;
  activeSpeakingMsgId: string | null;
  onPauseResumeSpeech: () => void;
  onStopSpeech: () => void;
  onPlayMessage: (msg: ChatMessage) => void;
}

const STARTER_PROMPTS = [
  'What is the TNEA Counselling Code for VSB?',
  'List all B.E. and B.Tech engineering departments',
  'Tell me about campus placements and top recruiters',
  'What bus routes and transport areas are covered?',
  'What are the hostel and dining facilities for students?',
  'What is the admission procedure and eligibility?',
];

export function ChatArea({
  messages,
  penguinState,
  voiceStatus,
  onPenguinStateChange,
  onSendMessage,
  isLoading,
  onStop,
  onToggleSidebar,
  onSelectPrompt,
  isVoiceOn,
  onToggleVoice,
  activeSpeakingMsgId,
  onPauseResumeSpeech,
  onStopSpeech,
  onPlayMessage,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Viewport breakpoint listener to mount the appropriate 3D canvas
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll conversation smoothly on new messages or loading state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Dynamic textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(trimmed);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Browser Speech-to-Text Microphone Input
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListeningMic) {
      setIsListeningMic(false);
      onPenguinStateChange('idle');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListeningMic(true);
        onPenguinStateChange('listening');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListeningMic(false);
        onPenguinStateChange('idle');
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
        onPenguinStateChange('idle');
      };

      recognition.onend = () => {
        setIsListeningMic(false);
        onPenguinStateChange('idle');
      };

      recognition.start();
    } catch (e) {
      console.error('Voice input error:', e);
      setIsListeningMic(false);
    }
  };

  const hasMessages = messages.length > 0;
  const isAudioActive = voiceStatus === 'speaking' || voiceStatus === 'paused';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/40 overflow-hidden relative">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* VSB Engineering College Identity */}
          <div className="flex items-center gap-2.5">
            <VSBLogo size="sm" />
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                VSB Engineering College
              </span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                Autonomous • TNEA 2622
              </span>
            </div>
          </div>
        </div>

        {/* Global Voice Toggle on Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleVoice}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isVoiceOn
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-2xs'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title={isVoiceOn ? 'AI Voice is Active (Auto-speaks answers)' : 'AI Voice is Muted'}
          >
            {isVoiceOn ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{isVoiceOn ? 'Voice On' : 'Voice Off'}</span>
          </button>
        </div>
      </header>

      {/* Main Two-Column Conversation Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* ========================================================= */}
        {/* LEFT SIDE: Dedicated 3D Penguin Assistant Panel (280-320px) */}
        {/* ========================================================= */}
        {!isMobile && (
          <aside className="hidden md:flex w-[280px] xl:w-[320px] shrink-0 h-full p-3 flex-col bg-slate-50/70 border-r border-slate-200/90 overflow-hidden sticky top-0 z-10">
            <PenguinAssistant
              state={penguinState}
              voiceStatus={voiceStatus}
              onStateChange={onPenguinStateChange}
              isVoiceEnabled={isVoiceOn}
              onToggleVoice={onToggleVoice}
              onPauseResumeSpeech={onPauseResumeSpeech}
              onStopSpeech={onStopSpeech}
              className="h-full w-full"
              isMobileCompact={false}
            />
          </aside>
        )}

        {/* ========================================================= */}
        {/* RIGHT SIDE: Conversation Messages & Input Area            */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white overflow-hidden">
          {/* Mobile-only compact mascot companion bar stacked above chat */}
          {isMobile && (
            <div className="md:hidden p-2.5 border-b border-slate-200 bg-slate-50/90 shrink-0">
              <PenguinAssistant
                state={penguinState}
                voiceStatus={voiceStatus}
                onStateChange={onPenguinStateChange}
                isVoiceEnabled={isVoiceOn}
                onToggleVoice={onToggleVoice}
                onPauseResumeSpeech={onPauseResumeSpeech}
                onStopSpeech={onStopSpeech}
                isMobileCompact={true}
              />
            </div>
          )}

          {/* Scrollable Conversation Stream */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {!hasMessages ? (
                /* Welcome Screen with Starter Questions (NO large horizontal card) */
                <div className="py-6 space-y-6">
                  <div className="text-center space-y-2 flex flex-col items-center">
                    <VSBLogo size="lg" className="mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      VSB Engineering College, Karur (Autonomous)
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      Official Campus AI Assistant
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                      Ask any questions about admissions, TNEA counselling code 2622, academic courses, top campus placements, transport routes, and hostel amenities.
                    </p>
                  </div>

                  {/* Starter FAQ Grid */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block text-center">
                      Suggested Inquiries
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {STARTER_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectPrompt(prompt)}
                          className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 text-left text-xs text-slate-800 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                        >
                          <span className="font-medium text-slate-800 group-hover:text-blue-900">
                            {prompt}
                          </span>
                          <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Message Thread */
                <div className="space-y-5">
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const isPlayingThis = activeSpeakingMsgId === msg.id && isAudioActive;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 text-xs leading-relaxed ${
                          isUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isUser && (
                          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs mt-0.5">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-2xs space-y-2.5 ${
                            isUser
                              ? 'bg-blue-600 text-white rounded-tr-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs sm:text-[13px]">
                            {msg.content}
                          </div>

                          {/* Sources Citation Bar */}
                          {!isUser && msg.sources && msg.sources.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1 font-semibold text-blue-600">
                                <FileCheck2 className="w-3 h-3" />
                                Verified College Record:
                              </span>
                              {msg.sources.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px]"
                                >
                                  {s.documentName}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action Bar for Assistant Messages */}
                          {!isUser && (
                            <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-500">
                              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>

                              <div className="flex items-center gap-1.5">
                                {/* Speech Play/Pause for individual message */}
                                <button
                                  onClick={() => onPlayMessage(msg)}
                                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                    isPlayingThis
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                                  }`}
                                  title={
                                    isPlayingThis
                                      ? voiceStatus === 'paused'
                                        ? 'Resume Speech'
                                        : 'Pause Speech'
                                      : 'Read Response Aloud'
                                  }
                                >
                                  {isPlayingThis ? (
                                    voiceStatus === 'paused' ? (
                                      <>
                                        <Play className="w-3.5 h-3.5 fill-emerald-800" />
                                        <span>Resume</span>
                                      </>
                                    ) : (
                                      <>
                                        <Pause className="w-3.5 h-3.5 animate-pulse" />
                                        <span>Pause</span>
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <Volume2 className="w-3.5 h-3.5" />
                                      <span>Speak</span>
                                    </>
                                  )}
                                </button>

                                {/* Copy text button */}
                                <button
                                  onClick={() => handleCopy(msg.id, msg.content)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                  title="Copy text"
                                >
                                  {copiedId === msg.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {isUser && (
                          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-medium">
                            <UserIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Thinking / Loading Indicator */}
                  {isLoading && (
                    <div className="flex gap-3 text-xs justify-start items-center">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-slate-200 text-slate-700 flex items-center gap-2.5 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11px] text-slate-600 ml-1 font-medium">
                          VSB 3D Mascot is consulting college records...
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Floating Audio Controller Bar when Speaking */}
          {isAudioActive && (
            <div className="px-4 py-2 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex items-center justify-between text-xs max-w-3xl mx-auto w-full z-10 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <Volume2 className="w-4 h-4 animate-bounce text-emerald-600" />
                <span>
                  {voiceStatus === 'paused'
                    ? 'Voice is paused'
                    : 'Mascot speaking response aloud...'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onPauseResumeSpeech}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  {voiceStatus === 'paused' ? (
                    <>
                      <Play className="w-3 h-3 fill-slate-700" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onStopSpeech}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-rose-700" />
                  <span>Stop Speaking</span>
                </button>
              </div>
            </div>
          )}

          {/* Sticky Bottom Message Input Area */}
          <footer className="border-t border-slate-200 bg-white p-3 sm:p-4 shrink-0 z-20">
            <div className="max-w-3xl mx-auto">
              <div className="relative rounded-2xl bg-slate-50/80 border-2 border-slate-200 focus-within:border-blue-600 focus-within:bg-white shadow-2xs transition-all p-2 flex items-end gap-2">
                {/* Voice Input Microphone Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                    isListeningMic
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={isListeningMic ? 'Listening... click to finish' : 'Voice Input (Dictate question)'}
                >
                  {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Question Input Textarea */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about VSB Engineering College... (Enter to send, Shift+Enter for new line)"
                  className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none resize-none py-2 px-1 max-h-36 leading-relaxed"
                />

                {/* Send or Stop Generation Button */}
                {isLoading ? (
                  <button
                    type="button"
                    onClick={onStop}
                    className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0 shadow-xs cursor-pointer"
                    title="Stop AI generation"
                  >
                    <Square className="w-4 h-4 fill-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className={`p-2.5 rounded-xl transition-all shrink-0 shadow-2xs ${
                      inputText.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>VSB Engineering College Autonomous Knowledge Retrieval</span>
                <span className="hidden sm:inline">Press Enter to send</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
