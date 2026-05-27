import { render, screen, fireEvent } from '@testing-library/react';
import Certificate from '../../components/Certificate';

const defaultProps = {
  isVisible: true,
  onClose: vi.fn(),
  userName: 'Karl Siaka',
  examType: 'cloud_practitioner',
  score: 42,
  totalQuestions: 50,
  percentage: 84,
  completionDate: new Date('2026-05-01'),
};

describe('Certificate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isVisible is true', () => {
    render(<Certificate {...defaultProps} />);
    expect(screen.getByText(/Certificate of Completion/i)).toBeInTheDocument();
  });

  it('does not render when isVisible is false', () => {
    render(<Certificate {...defaultProps} isVisible={false} />);
    expect(screen.queryByText(/Certificate of Completion/i)).not.toBeInTheDocument();
  });

  it('displays the user name', () => {
    render(<Certificate {...defaultProps} />);
    expect(screen.getByText('Karl Siaka')).toBeInTheDocument();
  });

  it('displays the score percentage', () => {
    render(<Certificate {...defaultProps} />);
    expect(screen.getByText(/84/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Certificate {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays AWS Cloud Practitioner exam name', () => {
    render(<Certificate {...defaultProps} examType="cloud_practitioner" />);
    expect(screen.getByText(/Cloud Practitioner/i)).toBeInTheDocument();
  });

  it('displays Solutions Architect exam name', () => {
    render(<Certificate {...defaultProps} examType="solutions_architect" />);
    expect(screen.getByText(/Solutions Architect/i)).toBeInTheDocument();
  });
});
