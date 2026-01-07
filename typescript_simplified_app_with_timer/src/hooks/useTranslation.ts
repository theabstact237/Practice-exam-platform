import { useState, useEffect, useCallback } from 'react';

// Supported languages with their codes, names, and flag emojis
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

interface Language {
  code: string;
  name: string;
  flag: string;
}

// Storage key for persisting language preference
const STORAGE_KEY = 'freecertify_language';

// Declare global types for Google Translate
declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: {
          new (config: {
            pageLanguage: string;
            includedLanguages: string;
            layout: number;
            autoDisplay: boolean;
          }, elementId: string): void;
          InlineLayout: {
            SIMPLE: number;
          };
        };
      };
    };
    googleTranslateElementInit: () => void;
  }
}

/**
 * Custom hook for managing translation state and Google Translate integration
 * 
 * Uses cookie-based translation triggering for reliability
 */
export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    // Try to get saved language preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = LANGUAGES.find(lang => lang.code === saved);
        if (found) return found;
      }
    }
    return LANGUAGES[0]; // Default to English
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Google Translate Element
  useEffect(() => {
    // Define the callback that Google Translate will call
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: LANGUAGES.map(l => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        setIsInitialized(true);
      }
    };

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="translate.google.com"]');
    if (!existingScript) {
      // Load the Google Translate script
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      // Script already loaded, initialize
      window.googleTranslateElementInit();
    }
  }, []);

  // Function to set the translation cookie and trigger translation
  const setTranslateCookie = useCallback((langCode: string) => {
    // Set the googtrans cookie which Google Translate reads
    const value = langCode === 'en' ? '' : `/en/${langCode}`;
    
    // Set cookie for current domain
    document.cookie = `googtrans=${value}; path=/`;
    
    // Also set for parent domain (handles subdomains)
    const domain = window.location.hostname;
    document.cookie = `googtrans=${value}; path=/; domain=${domain}`;
    
    // For localhost, also try without domain
    if (domain === 'localhost') {
      document.cookie = `googtrans=${value}; path=/`;
    }
  }, []);

  // Change language handler
  const changeLanguage = useCallback((languageCode: string) => {
    const language = LANGUAGES.find(l => l.code === languageCode);
    if (!language) return;

    // Update state
    setCurrentLanguage(language);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, languageCode);

    // Set the translation cookie
    setTranslateCookie(languageCode);

    // Try to use the Google Translate dropdown directly
    const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectElement) {
      selectElement.value = languageCode;
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // If no dropdown found, reload the page to apply cookie-based translation
      window.location.reload();
    }
  }, [setTranslateCookie]);

  return {
    currentLanguage,
    languages: LANGUAGES,
    changeLanguage,
    isInitialized,
  };
}

export default useTranslation;
