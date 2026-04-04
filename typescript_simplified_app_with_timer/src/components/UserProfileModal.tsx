import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, Award, Clock, CheckCircle, XCircle, AlertTriangle, Download, BarChart2, Pencil, Camera, Save } from 'lucide-react';
import { getUserExamAttempts, getExamAttemptDetail, ExamAttempt, QuestionResult, updateReviewProfile } from '../utils/api';

interface UserProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  };
  onViewCertificate: (examType: string, score: number, total: number, percentage: number, date: Date) => void;
  onProfileUpdate?: () => void;
}

const EXAM_LABELS: Record<string, string> = {
  solutions_architect: 'AWS Solutions Architect',
  cloud_practitioner: 'AWS Cloud Practitioner',
  developer: 'AWS Developer Associate',
  sysops: 'AWS SysOps Administrator',
  security: 'AWS Security Specialty',
  machine_learning: 'AWS Machine Learning',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const fmtTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isVisible,
  onClose,
  user,
  onViewCertificate,
  onProfileUpdate,
}) => {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [profileName, setProfileNameState] = useState(() => localStorage.getItem('fc_profile_name') || user.displayName || '');
  const [profilePhoto, setProfilePhotoState] = useState(() => localStorage.getItem('fc_profile_photo') || user.photoURL || '');

  const loadHistory = useCallback(async () => {
    setLoadingList(true);
    const list = await getUserExamAttempts(user.uid);
    setAttempts(list);
    setLoadingList(false);
  }, [user.uid]);

  useEffect(() => {
    if (isVisible) {
      setSelectedAttempt(null);
      setExpandedQuestion(null);
      setIsEditing(false);
      void loadHistory();
    }
  }, [isVisible, loadHistory]);

  const startEditing = () => {
    setEditName(profileName);
    setEditPhotoURL(profilePhoto);
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    const trimName = editName.trim();
    const trimPhoto = editPhotoURL.trim();
    if (trimName) localStorage.setItem('fc_profile_name', trimName);
    else localStorage.removeItem('fc_profile_name');
    if (trimPhoto) localStorage.setItem('fc_profile_photo', trimPhoto);
    else localStorage.removeItem('fc_profile_photo');
    // Update local state so the modal header reflects the change instantly
    setProfileNameState(trimName || user.displayName || '');
    setProfilePhotoState(trimPhoto || user.photoURL || '');
    setIsEditing(false);
    // Notify parent to refresh its displayed name/photo
    onProfileUpdate?.();
    // Persist the updated name/photo to all existing reviews in the database
    void updateReviewProfile(user.uid, trimName || user.displayName || '', trimPhoto || user.photoURL || '');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      alert('Image must be smaller than 500 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditPhotoURL(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openAttempt = async (attempt: ExamAttempt) => {
    setLoadingDetail(true);
    const detail = await getExamAttemptDetail(attempt.id, user.uid);
    setSelectedAttempt(detail);
    setExpandedQuestion(null);
    setLoadingDetail(false);
  };

  const certifications = attempts.filter(a => a.passed);

  if (!isVisible) return null;

  const displayName = profileName || user.email?.split('@')[0] || 'User';
  const displayPhoto = profilePhoto;
  const initials = (displayName).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            {selectedAttempt && (
              <button
                onClick={() => { setSelectedAttempt(null); setExpandedQuestion(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">
                {selectedAttempt
                  ? (EXAM_LABELS[selectedAttempt.exam_type] || selectedAttempt.exam_title)
                  : 'My Profile'}
              </h2>
              {selectedAttempt && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {fmt(selectedAttempt.created_at)} · {fmtTime(selectedAttempt.time_taken_seconds)} · {selectedAttempt.score_percent}%
                  {selectedAttempt.passed
                    ? <span className="ml-1 text-emerald-400">✓ Passed</span>
                    : <span className="ml-1 text-red-400">✗ Failed</span>}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ── DETAIL VIEW ── */}
          {selectedAttempt ? (
            loadingDetail ? (
              <div className="flex items-center justify-center py-16 text-slate-400">Loading questions…</div>
            ) : (
              <>
                {/* Domain breakdown */}
                {selectedAttempt.domain_scores && Object.keys(selectedAttempt.domain_scores).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4" />Domain Performance
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(selectedAttempt.domain_scores)
                        .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
                        .map(([domain, stats]) => {
                          const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                          const bar = pct < 60 ? 'bg-red-500' : pct < 80 ? 'bg-amber-500' : 'bg-emerald-500';
                          return (
                            <div key={domain}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-300 truncate max-w-[60%]">{domain}</span>
                                <span className="text-slate-400">{stats.correct}/{stats.total} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 bg-slate-700 rounded-full">
                                <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Summary bar */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Correct', value: selectedAttempt.correct, color: 'text-emerald-400' },
                    { label: 'Incorrect', value: selectedAttempt.total - selectedAttempt.correct, color: 'text-red-400' },
                    { label: 'Score', value: `${selectedAttempt.score_percent}%`, color: selectedAttempt.passed ? 'text-emerald-400' : 'text-amber-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-700/60 rounded-xl p-3 text-center">
                      <div className={`text-xl font-bold ${color}`}>{value}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Questions list */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">
                    Questions ({selectedAttempt.question_results?.length ?? 0})
                  </h3>
                  <div className="space-y-2">
                    {(selectedAttempt.question_results ?? []).map((qr: QuestionResult, idx: number) => (
                      <QuestionRow
                        key={qr.question_id}
                        qr={qr}
                        index={idx}
                        expanded={expandedQuestion === idx}
                        onToggle={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )
          ) : (
            /* ── PROFILE VIEW ── */
            <>
              {/* User info card */}
              {isEditing ? (
                <div className="p-4 bg-slate-700/50 rounded-2xl space-y-4">
                  <p className="text-sm font-semibold text-slate-300 mb-1">Edit Profile</p>

                  {/* Photo */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {editPhotoURL ? (
                        <img src={editPhotoURL} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-sky-500/50" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-sky-600 flex items-center justify-center text-xl font-bold text-white border-2 border-sky-500/50">
                          {(editName || 'U').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <label className="absolute -bottom-1 -right-1 p-1 bg-sky-600 hover:bg-sky-500 rounded-full cursor-pointer transition-colors">
                        <Camera className="w-3.5 h-3.5 text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Display Name (shown on certificates)</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Photo URL (or upload above)</label>
                        <input
                          type="text"
                          value={editPhotoURL}
                          onChange={e => setEditPhotoURL(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-2xl">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-sky-500/50" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-sky-600 flex items-center justify-center text-xl font-bold text-white border-2 border-sky-500/50">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-white truncate">{displayName}</p>
                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                    <p className="text-xs text-slate-500 mt-1">{attempts.length} exam attempt{attempts.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={startEditing}
                    className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors shrink-0"
                    title="Edit Profile"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Certifications */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Certifications Earned
                </h3>
                {certifications.length === 0 ? (
                  <div className="text-sm text-slate-500 italic px-2">
                    No certifications yet. Pass an exam with ≥70% to earn your certificate.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {certifications.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-emerald-300">
                            {EXAM_LABELS[a.exam_type] || a.exam_title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Score {a.score_percent}% · {fmt(a.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => onViewCertificate(a.exam_type, a.correct, a.total, a.score_percent, new Date(a.created_at))}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Certificate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exam History */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Exam History
                </h3>
                {loadingList ? (
                  <div className="text-sm text-slate-500 text-center py-8">Loading history…</div>
                ) : attempts.length === 0 ? (
                  <div className="text-sm text-slate-500 italic px-2">
                    No exams taken yet. Start a practice exam to build your history.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attempts.map(a => (
                      <button
                        key={a.id}
                        onClick={() => openAttempt(a)}
                        className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            {a.passed
                              ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                              : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                            }
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {EXAM_LABELS[a.exam_type] || a.exam_title}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {fmt(a.created_at)} · {fmtTime(a.time_taken_seconds)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <div className="text-right">
                              <span className={`text-base font-bold ${a.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                {a.score_percent}%
                              </span>
                              <p className="text-xs text-slate-500">{a.correct}/{a.total}</p>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Single question row (collapsible) ── */
const QuestionRow: React.FC<{
  qr: QuestionResult;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}> = ({ qr, index, expanded, onToggle }) => {
  const icon = qr.timed_out
    ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
    : qr.is_correct
      ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
      : <XCircle className="w-4 h-4 text-red-400 shrink-0" />;

  const bg = qr.timed_out
    ? 'border-amber-500/20 bg-amber-900/10'
    : qr.is_correct
      ? 'border-emerald-500/20 bg-emerald-900/10'
      : 'border-red-500/20 bg-red-900/10';

  return (
    <div className={`rounded-xl border ${bg} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 line-clamp-2">
            <span className="text-slate-500 mr-1">Q{index + 1}.</span>
            {qr.question_text}
          </p>
          {!expanded && (
            <p className="text-xs text-slate-500 mt-0.5">
              {qr.timed_out
                ? '⏱ Timed out'
                : qr.is_correct
                  ? `✓ ${qr.selected_letter}`
                  : `Your answer: ${qr.selected_letter ?? '–'} · Correct: ${qr.correct_letter}`}
            </p>
          )}
        </div>
        <ChevronLeft className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${expanded ? '-rotate-90' : 'rotate-180'}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
          {/* Options */}
          <div className="mt-3 space-y-1.5">
            {qr.options.map(opt => {
              const isCorrect = opt.letter === qr.correct_letter;
              const isSelected = opt.letter === qr.selected_letter;
              let cls = 'flex items-start gap-2 px-3 py-2 rounded-lg text-sm border ';
              if (isCorrect) cls += 'bg-emerald-900/30 border-emerald-500/40 text-emerald-200';
              else if (isSelected && !isCorrect) cls += 'bg-red-900/30 border-red-500/40 text-red-200';
              else cls += 'bg-slate-700/30 border-slate-600/30 text-slate-400';
              return (
                <div key={opt.letter} className={cls}>
                  <span className="font-bold shrink-0">{opt.letter}.</span>
                  <span className="flex-1">{opt.text}</span>
                  {isCorrect && <span className="text-emerald-400 shrink-0 text-xs font-semibold">✓ Correct</span>}
                  {isSelected && !isCorrect && <span className="text-red-400 shrink-0 text-xs font-semibold">✗ Your answer</span>}
                </div>
              );
            })}
          </div>
          {/* Explanation */}
          {qr.explanation && (
            <div className="text-xs text-slate-400 bg-slate-700/40 rounded-lg p-3 border border-slate-600/40">
              <span className="text-sky-400 font-semibold">💡 Explanation: </span>
              {qr.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfileModal;
