import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export interface Testimonial {
  id: number;
  user_name: string;
  user_photo_url: string;
  exam_name: string;
  rating: number;
  comment: string;
  passed: boolean;
  exam_score: number | null;
  created_at: string;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  autoPlayInterval?: number;
}

function useVisibleCount() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setCount(3);
      else if (window.innerWidth >= 640) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return count;
}

const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  testimonials,
  autoPlayInterval = 5000,
}) => {
  const visibleCount = useVisibleCount();
  const total = testimonials.length;
  const maxIndex = Math.max(0, total - visibleCount);

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((i: number) => {
    setIndex(Math.min(Math.max(i, 0), maxIndex));
  }, [maxIndex]);

  const next = useCallback(() => goTo(index >= maxIndex ? 0 : index + 1), [index, maxIndex, goTo]);
  const prev = useCallback(() => goTo(index <= 0 ? maxIndex : index - 1), [index, maxIndex, goTo]);

  // Clamp index when window resizes and maxIndex shrinks
  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex);
  }, [maxIndex, index]);

  // Auto-play
  useEffect(() => {
    if (total <= visibleCount || isPaused) return;
    timerRef.current = setInterval(next, autoPlayInterval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, total, visibleCount, isPaused, autoPlayInterval]);

  if (total === 0) return null;

  const cardWidthPct = 100 / visibleCount;
  const translatePct = -(index * cardWidthPct);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${translatePct}%)` }}
        >
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="flex-shrink-0 px-3"
              style={{ width: `${cardWidthPct}%` }}
            >
              <div className="h-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden p-6 flex flex-col">
                {/* Quote */}
                <div className="mb-3 opacity-20">
                  <Quote size={28} className="text-sky-400" />
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s <= t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-5 line-clamp-4">
                  "{t.comment}"
                </p>

                {/* User */}
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-700/50">
                  {t.user_photo_url ? (
                    <img
                      src={t.user_photo_url}
                      alt={t.user_name}
                      className="w-10 h-10 rounded-full border-2 border-sky-500 object-cover flex-shrink-0"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        const sibling = el.nextElementSibling as HTMLElement | null;
                        if (sibling) sibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex-shrink-0 items-center justify-center"
                    style={{ display: t.user_photo_url ? 'none' : 'flex' }}
                  >
                    <span className="text-white font-bold text-sm">
                      {t.user_name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{t.user_name}</p>
                    <p className="text-sky-400 text-xs truncate">{t.exam_name}</p>
                    {t.passed && t.exam_score != null && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs">
                        Passed · {t.exam_score}%
                      </span>
                    )}
                  </div>
                  <span className="ml-auto text-slate-600 text-xs flex-shrink-0">
                    {formatDate(t.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {total > visibleCount && (
        <>
          <button
            onClick={prev}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-slate-700 hover:bg-sky-600 border border-slate-600 hover:border-sky-500 rounded-full text-white shadow-lg transition-all hover:scale-110"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-slate-700 hover:bg-sky-600 border border-slate-600 hover:border-sky-500 rounded-full text-white shadow-lg transition-all hover:scale-110"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {total > visibleCount && (
        <div className="flex justify-center gap-1.5 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? 'bg-sky-500 w-6 h-2.5'
                  : 'bg-slate-600 hover:bg-slate-500 w-2.5 h-2.5'
              }`}
            />
          ))}
        </div>
      )}

      {/* Count badge */}
      <p className="text-center text-slate-500 text-xs mt-3">
        {index + 1}–{Math.min(index + visibleCount, total)} of {total} reviews
      </p>
    </div>
  );
};

export default TestimonialsCarousel;
