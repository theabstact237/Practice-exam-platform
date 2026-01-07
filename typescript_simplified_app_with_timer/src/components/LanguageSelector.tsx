import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useTranslation, LANGUAGES } from '../hooks/useTranslation';

interface LanguageSelectorProps {
  className?: string;
}

/**
 * Language Selector Component
 * 
 * A dropdown component that allows users to switch the website language.
 * Uses Google Translate API under the hood for automatic translation.
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { currentLanguage, changeLanguage, isInitialized } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === currentLanguage.code) {
      setIsOpen(false);
      return;
    }

    setIsTranslating(true);
    setIsOpen(false);
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    
    changeLanguage(languageCode);
    
    // The page will reload or translate, so we don't need to reset isTranslating
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 disabled:opacity-50"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {isTranslating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Globe className="w-4 h-4" />
        )}
        <span className="text-lg" aria-hidden="true">{currentLanguage.flag}</span>
        <ChevronDown 
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[100] overflow-hidden"
          role="listbox"
          aria-label="Available languages"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          {/* Header */}
          <div className="px-4 py-2 bg-slate-700/50 border-b border-slate-700">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Select Language
            </p>
          </div>

          {/* Language Options */}
          <div className="py-1 max-h-64 overflow-y-auto">
            {LANGUAGES.map((language) => {
              const isSelected = currentLanguage.code === language.code;
              
              return (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150
                    ${isSelected 
                      ? 'bg-sky-600/20 text-sky-400' 
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Flag */}
                  <span className="text-xl" aria-hidden="true">
                    {language.flag}
                  </span>
                  
                  {/* Language Name */}
                  <span className="flex-1 font-medium notranslate">
                    {language.name}
                  </span>
                  
                  {/* Check Mark for Selected */}
                  {isSelected && (
                    <Check className="w-4 h-4 text-sky-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer - Info text */}
          <div className="px-4 py-2 bg-slate-700/30 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              {isInitialized ? '✓ Translator ready' : '⏳ Loading...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
