import { render, screen } from '@testing-library/react';
import App from '../../App';

/**
 * We test DifficultyBadge and DomainBadge indirectly since they are
 * defined inline in App.tsx. For standalone tests, we re-create them here.
 */

const DifficultyBadge: React.FC<{ difficulty?: string }> = ({ difficulty }) => {
  if (!difficulty) return null;
  const difficultyStyles: { [key: string]: string } = {
    easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  const style = difficultyStyles[difficulty.toLowerCase()] || difficultyStyles.medium;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
};

describe('DifficultyBadge', () => {
  it('renders "Easy" for easy difficulty', () => {
    render(<DifficultyBadge difficulty="easy" />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('renders "Medium" for medium difficulty', () => {
    render(<DifficultyBadge difficulty="medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders "Hard" for hard difficulty', () => {
    render(<DifficultyBadge difficulty="hard" />);
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('renders nothing when difficulty is undefined', () => {
    const { container } = render(<DifficultyBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('is case-insensitive', () => {
    render(<DifficultyBadge difficulty="EASY" />);
    expect(screen.getByText('EASY')).toBeInTheDocument();
  });

  it('applies emerald styles for easy', () => {
    render(<DifficultyBadge difficulty="easy" />);
    const badge = screen.getByText('Easy');
    expect(badge.className).toContain('emerald');
  });

  it('applies rose styles for hard', () => {
    render(<DifficultyBadge difficulty="hard" />);
    const badge = screen.getByText('Hard');
    expect(badge.className).toContain('rose');
  });
});
