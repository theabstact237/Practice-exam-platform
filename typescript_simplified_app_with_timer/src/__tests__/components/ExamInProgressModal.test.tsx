import { render, screen, fireEvent } from '@testing-library/react';
import ExamInProgressModal from '../../components/ExamInProgressModal';

const defaultProps = {
  isVisible: true,
  onClose: vi.fn(),
  onContinueExam: vi.fn(),
  onAbandonExam: vi.fn(),
  userName: 'Karl Siaka',
  currentExamType: 'cloud_practitioner',
  currentProgress: 15,
  totalQuestions: 50,
};

describe('ExamInProgressModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders when visible', () => {
    render(<ExamInProgressModal {...defaultProps} />);
    expect(screen.getByText(/exam in progress/i)).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<ExamInProgressModal {...defaultProps} isVisible={false} />);
    expect(screen.queryByText(/exam in progress/i)).not.toBeInTheDocument();
  });

  it('shows current progress', () => {
    render(<ExamInProgressModal {...defaultProps} />);
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('calls onContinueExam when continue button is clicked', () => {
    const onContinue = vi.fn();
    render(<ExamInProgressModal {...defaultProps} onContinueExam={onContinue} />);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onAbandonExam when abandon button is clicked', () => {
    const onAbandon = vi.fn();
    render(<ExamInProgressModal {...defaultProps} onAbandonExam={onAbandon} />);
    fireEvent.click(screen.getByRole('button', { name: /abandon|start new|leave/i }));
    expect(onAbandon).toHaveBeenCalledTimes(1);
  });

  it('displays the user name in modal', () => {
    render(<ExamInProgressModal {...defaultProps} />);
    expect(screen.getByText(/Karl Siaka/i)).toBeInTheDocument();
  });
});
