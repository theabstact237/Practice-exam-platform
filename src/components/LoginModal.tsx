import React, { useState } from 'react';
import { X, Mail, Github } from 'lucide-react';
import { signInWithGoogle, signInWithGitHub } from '../utils/auth';
import { analytics } from '../utils/analytics';

interface LoginModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  questionNumber: number;
  examType: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ 
  isVisible, 
  onClose, 
  onSuccess, 
  questionNumber
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signInWithGoogle();
      if (result) {
        analytics.contactFormSubmitted(true);
        analytics.examTypeChanged('guest', 'authenticated');
        onSuccess();
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    } catch (error) {
      setError('An error occurred during Google sign-in.');
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signInWithGitHub();
      if (result) {
        analytics.contactFormSubmitted(true);
        analytics.examTypeChanged('guest', 'authenticated');
        onSuccess();
      } else {
        setError('Failed to sign in with GitHub. Please try again.');
      }
    } catch (error) {
      setError('An error occurred during GitHub sign-in.');
      console.error('GitHub sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    analytics.paymentTabClicked('continue_without_login');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Continue Your Journey</h2>
            <p className="text-slate-300 text-sm mt-1">
              You've reached question {questionNumber}! 🎉
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Unlock Your Full Potential
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sign in to save your progress, track your performance, and get personalized 
              study recommendations. Your data helps us improve the platform for everyone!
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-slate-700 rounded-lg p-4 mb-6">
            <h4 className="text-white font-medium mb-3">What you'll get:</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Save your progress across devices
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Detailed performance analytics
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Personalized study recommendations
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                Early access to new features
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Sign In Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
            
            <button
              onClick={handleGitHubSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Github className="w-5 h-5 mr-3" />
              {isLoading ? 'Signing in...' : 'Continue with GitHub'}
            </button>
          </div>

          {/* Continue Without Login */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <button
              onClick={handleContinueWithoutLogin}
              className="w-full text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              Continue without signing in
            </button>
            <p className="text-xs text-slate-500 mt-2 text-center">
              You can still complete the exam, but progress won't be saved
            </p>
          </div>

          {/* Privacy Note */}
          <div className="mt-4 p-3 bg-slate-700 bg-opacity-50 rounded-lg">
            <p className="text-xs text-slate-400 text-center">
              🔒 We respect your privacy. Your email is only used for progress tracking 
              and optional updates. No spam, ever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

