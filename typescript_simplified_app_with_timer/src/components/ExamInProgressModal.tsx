import React from 'react';
import { X, AlertTriangle, BookOpen, ArrowRight } from 'lucide-react';

interface ExamInProgressModalProps {
  isVisible: boolean;
  onClose: () => void;
  onContinueExam: () => void;
  onAbandonExam: () => void;
  userName: string;
  currentExamType: string;
  currentProgress: number;
  totalQuestions: number;
}

const ExamInProgressModal: React.FC<ExamInProgressModalProps> = ({
  isVisible,
  onClose,
  onContinueExam,
  onAbandonExam,
  userName,
  currentExamType,
  currentProgress,
  totalQuestions
}) => {
  if (!isVisible) return null;

  const getExamDisplayName = (type: string): string => {
    switch (type) {
      case 'solutions_architect':
        return 'Solutions Architect';
      case 'cloud_practitioner':
        return 'Cloud Practitioner';
      case 'developer':
        return 'Developer Associate';
      default:
        return 'AWS Certification';
    }
  };

  const progressPercentage = Math.round((currentProgress / totalQuestions) * 100);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full my-4 max-h-[90vh] overflow-y-auto">
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
            }}></div>
          </div>
          
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">
                Hold On! ✋
              </h2>
              <p className="text-amber-100 text-sm mt-1">
                You have an exam in progress
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Personalized Message */}
          <div className="text-center mb-6">
            <p className="text-xl text-white mb-2">
              Hey <span className="text-sky-400 font-semibold">{userName}</span>! 👋
            </p>
            <p className="text-slate-300 text-lg">
              You haven't finished your exam yet! 📝
            </p>
          </div>

          {/* Current Exam Info */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <span className="text-slate-300">Current Exam:</span>
              <span className="text-white font-semibold">
                {getExamDisplayName(currentExamType)}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Progress</span>
                <span className="text-sky-400 font-semibold">
                  {currentProgress} / {totalQuestions} questions
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <p className="text-slate-400 text-sm text-center">
              You're {progressPercentage}% through! Keep going! 💪
            </p>
          </div>

          {/* Message */}
          <p className="text-slate-400 text-center mb-6 text-sm">
            If you switch to another exam now, your current progress will be lost. 
            We recommend finishing your current exam first!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onContinueExam}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/25 hover:scale-[1.02]"
            >
              Continue My Exam
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onAbandonExam}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl font-medium transition-all border border-slate-600"
            >
              Abandon & Start New Exam
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ExamInProgressModal;

