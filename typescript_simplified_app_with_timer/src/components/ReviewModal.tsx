import React, { useState } from 'react';
import { Star, X, Send, MessageSquare } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: ReviewData) => void;
  examName: string;
  examId: number;
  examScore: number;
  passed: boolean;
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
}

export interface ReviewData {
  exam: number;
  user_uid: string;
  user_name: string;
  user_photo_url: string;
  user_email: string;
  rating: number;
  comment: string;
  exam_score: number;
  passed: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  examName,
  examId,
  examScore,
  passed,
  user
}) => {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user || !comment.trim()) return;
    
    setIsSubmitting(true);
    
    const reviewData: ReviewData = {
      exam: examId,
      user_uid: user.uid,
      user_name: user.displayName || 'Anonymous',
      user_photo_url: user.photoURL || '',
      user_email: user.email || '',
      rating,
      comment: comment.trim(),
      exam_score: examScore,
      passed
    };
    
    await onSubmit(reviewData);
    setIsSubmitting(false);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-sky-500/10 to-purple-500/10">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sky-500/20 rounded-lg">
              <MessageSquare className="w-6 h-6 text-sky-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Share Your Experience</h2>
          </div>
          
          <p className="text-slate-400 text-sm">
            How was your experience with the <span className="text-sky-400 font-medium">{examName}</span> exam?
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-3">Rate your experience</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Comment Input */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Your feedback (will be shown on homepage)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this exam..."
              className="w-full h-28 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-slate-500 mt-1 text-right">
              {comment.length}/500 characters
            </p>
          </div>

          {/* User Preview */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-sky-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <span className="text-sky-400 font-bold">
                    {(user.displayName || 'A')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-white font-medium text-sm">
                  {user.displayName || 'Anonymous'}
                </p>
                <p className="text-slate-500 text-xs">Your review will appear publicly</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-xl transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
