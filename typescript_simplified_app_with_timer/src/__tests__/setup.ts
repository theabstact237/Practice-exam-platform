import '@testing-library/jest-dom';

// Mock Firebase so tests never hit real Firebase
vi.mock('../config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: vi.fn(() => [null, false, undefined]),
}));

// Mock Google Analytics so tests don't make network calls
vi.mock('../utils/analytics', () => ({
  initGA: vi.fn(),
  analytics: {
    pageChanged: vi.fn(),
    examStarted: vi.fn(),
    examCompleted: vi.fn(),
    examTypeChanged: vi.fn(),
    examRestarted: vi.fn(),
    questionAnswered: vi.fn(),
    questionTimedOut: vi.fn(),
    progressMilestone: vi.fn(),
    reviewModeEntered: vi.fn(),
    contactFormSubmitted: vi.fn(),
    socialMediaClicked: vi.fn(),
    paymentTabClicked: vi.fn(),
    paymentLinkClicked: vi.fn(),
    copyToClipboard: vi.fn(),
    mobileMenuToggled: vi.fn(),
    questionLoadError: vi.fn(),
    sessionDuration: vi.fn(),
  },
  setUserProperties: vi.fn(),
}));

// Mock analytics client utilities
vi.mock('../utils/analyticsClient', () => ({
  getOrCreateSessionKey: vi.fn(() => 'test-session-key'),
  getDeviceCategory: vi.fn(() => 'desktop'),
}));

// Silence console.error for expected test warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
