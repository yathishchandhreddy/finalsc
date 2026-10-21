import React from 'react';
import {
  Plus,
  MessageSquare,
  HelpCircle,
  Building2,
  ShieldCheck,
  Trash2,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Sparkles,
  X
} from 'lucide-react';
import { ChatSession } from '../types';
import { VSBLogo } from './VSBLogo';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenAbout: () => void;
  onOpenAdmin: () => void;
  onSelectFaqPrompt: (prompt: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const COLLEGE_FAQS = [
  {
    title: 'TNEA Code & Admissions',
    query: 'What is the TNEA counselling code for VSB Engineering College and how can I apply for admission?',
  },
  {
    title: 'Available Degree Programs',
    query: 'What B.E. and B.Tech undergraduate departments are offered at VSB Engineering College?',
  },
  {
    title: 'Placements & Companies',
    query: 'Can you tell me about the placement statistics and top recruiting companies visiting VSB Engineering College?',
  },
  {
    title: 'College Bus Routes',
    query: 'What areas and districts are covered by the VSB College bus transport network?',
  },
  {
    title: 'Hostel & Food Facilities',
    query: 'What are the residential hostel, dining, and Wi-Fi facilities for boys and girls on campus?',
  },
  {
    title: 'Library & Labs',
    query: 'What computing labs and library resources are accessible to students?',
  },
];

export function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenAbout,
  onOpenAdmin,
  onSelectFaqPrompt,
  isOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop - Soft frosted white/slate, no black */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/20 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header / Branding with official collegiate Logo */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <VSBLogo size="md" />
            <div>
              <h1 className="text-xs font-bold text-slate-900 leading-tight">
                VSB Engineering College
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">
                Autonomous • Karur, TN
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Scrollable Center: Chat History & College FAQs */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 py-2">
          {/* Chat History Section */}
          <div>
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Recent Chats
              </span>
              <span className="text-[10px] text-slate-400">
                {sessions.length}
              </span>
            </div>

            <div className="space-y-1">
              {sessions.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No previous conversations
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.id === currentSessionId;
                  return (
                    <div
                      key={sess.id}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-900 border-blue-200 font-semibold'
                          : 'text-slate-700 border-transparent hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      onClick={() => {
                        onSelectSession(sess.id);
                        onCloseMobile();
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{sess.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(sess.id);
                        }}
                        title="Delete chat"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* College Quick FAQs */}
          <div>
            <div className="px-1 mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-500" />
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                College FAQs
              </span>
            </div>

            <div className="space-y-1">
              {COLLEGE_FAQS.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectFaqPrompt(faq.query);
                    onCloseMobile();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors flex items-center justify-between group border border-transparent hover:border-slate-200"
                >
                  <span className="truncate pr-1">{faq.title}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: About & Admin Panel */}
        <div className="p-3 border-t border-slate-200 space-y-1.5 bg-slate-50">
          <button
            onClick={() => {
              onOpenAbout();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
          >
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium">About VSB Engineering</span>
          </button>

          <button
            onClick={() => {
              onOpenAdmin();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Admin Panel</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
              Staff Only
            </span>
          </button>

          <div className="pt-2 px-1 text-[10px] text-slate-500 text-center flex items-center justify-between">
            <span>TNEA Code: 2622</span>
            <span>NAAC 'A' Grade</span>
          </div>
        </div>
      </aside>
    </>
  );
}
