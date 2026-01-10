import React, { useState, useEffect } from 'react';
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
  autoPlayInterval?: number; // in milliseconds
}

const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  testimonials,
  autoPlayInterval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (testimonials.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [currentIndex, testimonials.length, autoPlayInterval, isPaused]);

  const goToNext = () => {
    if (isAnimating || testimonials.length <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToPrev = () => {
    if (isAnimating || testimonials.length <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  if (testimonials.length === 0) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Card */}
      <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Quote Icon */}
        <div className="absolute top-6 left-6 opacity-20">
          <Quote size={48} className="text-sky-400" />
        </div>

        {/* Content */}
        <div 
          className={`p-8 md:p-12 transition-opacity duration-500 ${
            isAnimating ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                className={`${
                  star <= currentTestimonial.rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Comment */}
          <blockquote className="text-center mb-8">
            <p className="text-lg md:text-xl text-slate-200 italic leading-relaxed">
              "{currentTestimonial.comment}"
            </p>
          </blockquote>

          {/* User Info */}
          <div className="flex flex-col items-center">
            {/* Profile Picture */}
            {currentTestimonial.user_photo_url ? (
              <img
                src={currentTestimonial.user_photo_url}
                alt={currentTestimonial.user_name}
                className="w-16 h-16 rounded-full border-3 border-sky-500 shadow-lg shadow-sky-500/20 object-cover mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%230ea5e9'/%3E%3Ctext x='50%25' y='55%25' font-size='28' fill='white' text-anchor='middle'%3E${currentTestimonial.user_name[0].toUpperCase()}%3C/text%3E%3C/svg%3E`;
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/20">
                <span className="text-white text-2xl font-bold">
                  {currentTestimonial.user_name[0].toUpperCase()}
                </span>
              </div>
            )}

            {/* Name & Exam */}
            <h4 className="text-white font-semibold text-lg">
              {currentTestimonial.user_name}
            </h4>
            <p className="text-sky-400 text-sm font-medium">
              {currentTestimonial.exam_name}
            </p>
            
            {/* Score Badge */}
            {currentTestimonial.passed && currentTestimonial.exam_score && (
              <div className="mt-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                <span className="text-emerald-400 text-xs font-medium">
                  Passed with {currentTestimonial.exam_score}%
                </span>
              </div>
            )}
            
            {/* Date */}
            <p className="text-slate-500 text-xs mt-2">
              {formatDate(currentTestimonial.created_at)}
            </p>
          </div>
        </div>

        {/* Navigation Arrows */}
        {testimonials.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-full text-white transition-all hover:scale-110"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-full text-white transition-all hover:scale-110"
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-sky-500 w-8'
                  : 'bg-slate-600 hover:bg-slate-500'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TestimonialsCarousel;
