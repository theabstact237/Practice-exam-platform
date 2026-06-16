import React, { useEffect, useRef } from 'react';

export interface SyllabusLecture {
  title: string;
  focus: string;
  duration_minutes: number;
  resources: string[];
  hands_on_lab: string;
}

export interface SyllabusLecturePlan {
  syllabus: string;
  syllabus_label: string;
  provider: string;
  overview: string;
  lectures: SyllabusLecture[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  off_topic?: boolean;
}

interface AIAssistantModalProps {
  isVisible: boolean;
  loading: boolean;
  chatLoading: boolean;
  error: string | null;
  statusMsg?: string | null;
  selectedSyllabus: string | null;
  lecturePlan: SyllabusLecturePlan | null;
  chatMessages: ChatMessage[];
  chatInput: string;
  isPinned: boolean;
  onClose: () => void;
  onSelectSyllabus: (syllabus: string) => void;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onQuickPromptSend: (text: string) => void;
  onTogglePin: () => void;
}

const QUICK_PROMPTS = [
  'Give me a 7-day study plan from these lectures',
  'Which lecture should I start with as a beginner?',
  'What are the most exam-weighted topics here?',
  'Explain the hands-on labs in more detail',
  'What are common mistakes students make?',
];

const SYLLABUS_OPTIONS = [
  { key: 'solutions_architect', label: 'Solutions Architect' },
  { key: 'cloud_practitioner', label: 'Cloud Practitioner' },
  { key: 'developer', label: 'Developer' },
  { key: 'python', label: '🐍 Python Programming' },
];

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isVisible,
  loading,
  chatLoading,
  error,
  statusMsg,
  selectedSyllabus,
  lecturePlan,
  chatMessages,
  chatInput,
  isPinned,
  onClose,
  onSelectSyllabus,
  onChatInputChange,
  onSendMessage,
  onQuickPromptSend,
  onTogglePin,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">AI Study Assistant</h2>
          <div className="flex items-center gap-3">
            {lecturePlan && (
              <button
                onClick={onTogglePin}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  isPinned
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'
                }`}
              >
                {isPinned ? 'Pinned' : 'Pin plan'}
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
              Close
            </button>
          </div>
        </div>

        <p className="text-slate-300 mb-4">
          Welcome! Which certification syllabus do you want to prepare for today?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {SYLLABUS_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => onSelectSyllabus(option.key)}
              className={`rounded-lg px-4 py-3 text-sm font-medium border transition ${
                selectedSyllabus === option.key
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              disabled={loading}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-sky-300 mb-4">
            {statusMsg ?? 'Generating tailored lecture roadmap...'}
          </p>
        )}
        {!loading && error && <p className="text-red-400 mb-4">{error}</p>}

        {lecturePlan && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold mb-2">{lecturePlan.syllabus_label}</h3>
              <p className="text-slate-300 text-sm">{lecturePlan.overview}</p>
            </div>

            <div className="space-y-3">
              {lecturePlan.lectures.map((lecture, idx) => (
                <div key={`${lecture.title}-${idx}`} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{idx + 1}. {lecture.title}</h4>
                    <span className="text-xs text-slate-400">{lecture.duration_minutes} min</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{lecture.focus}</p>
                  <p className="text-xs text-emerald-300 mb-2">Lab: {lecture.hands_on_lab}</p>
                  <p className="text-xs text-slate-400">
                    Resources: {(lecture.resources || []).join(', ')}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h4 className="font-semibold mb-3">Chat with your AI study assistant</h4>
              <div className="h-56 overflow-y-auto bg-slate-900 rounded-md p-3 space-y-3 mb-3 border border-slate-700">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Ask about AWS services, exam concepts, study strategies, or lecture content.
                  </p>
                )}
                {chatMessages.map((message, idx) => {
                  const isLastMsg = idx === chatMessages.length - 1;
                  const isThinking = chatLoading && isLastMsg && message.role === 'assistant' && message.content === '';
                  return (
                    <div
                      key={`${message.role}-${idx}`}
                      className={`text-sm p-2 rounded-md ${
                        message.role === 'user'
                          ? 'bg-sky-600/20 border border-sky-500/40 text-sky-100'
                          : message.off_topic
                            ? 'bg-amber-900/30 border border-amber-600/50 text-amber-200'
                            : 'bg-slate-700/40 border border-slate-600 text-slate-100'
                      }`}
                    >
                      <p className="text-xs uppercase tracking-wide mb-1 opacity-75">
                        {message.role === 'user' ? 'You' : message.off_topic ? '⚠ Off-topic' : 'Assistant'}
                      </p>
                      {isThinking ? (
                        <span className="flex items-center gap-1 h-5">
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onQuickPromptSend(prompt)}
                    disabled={chatLoading}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white transition disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => onChatInputChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage(); } }}
                  placeholder="Ask about AWS services, exam tips, or study strategy..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  disabled={chatLoading}
                />
                <button
                  onClick={onSendMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 rounded-md text-sm font-medium"
                >
                  {chatLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantModal;
