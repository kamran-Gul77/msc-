"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Feedback {
  id: string;
  name: string;
  experience: string;
  suggestion?: string;
  rating: number;
}

export default function FeedbackCarousel() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchFeedback = async () => {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setFeedbacks(data);
    };
    fetchFeedback();
  }, []);

  const goToSlide = (index: number) => {
    if (isTransitioning || feedbacks.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToPrevious = () => {
    const newIndex =
      currentIndex === 0 ? feedbacks.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex =
      currentIndex === feedbacks.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  useEffect(() => {
    if (feedbacks.length === 0) return;

    const interval = setInterval(() => {
      goToNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, feedbacks.length]);

  if (feedbacks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <h2 className="text-center text-3xl font-bold text-white mb-8">
          What Our Learners Say
        </h2>
        <div className="bg-[#212121] border border-[#303030] rounded-xl p-12 text-center">
          <p className="text-gray-400">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <h2 className="text-center text-3xl font-bold text-white mb-8">
        What Our Learners Say
      </h2>

      <div className="relative">
        {/* Carousel Container */}
        <div className="relative overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {feedbacks?.map((fb, i) => (
              <div key={i} className="w-full flex-shrink-0 px-2">
                <div className="bg-[#212121] border border-[#303030] rounded-xl p-8 shadow-xl">
                  <div className="flex items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, starIndex) => (
                          <span
                            key={starIndex}
                            className={`text-xl ${
                              starIndex < fb.rating
                                ? "text-yellow-400"
                                : "text-gray-600"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-lg text-white leading-relaxed mb-4">
                        &quot;{fb.experience}&quot;
                      </p>
                      {fb.suggestion && (
                        <p className="text-sm text-gray-400 italic">
                          {fb.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-[#303030]">
                    <p className="text-white font-semibold">
                      {fb.name || "Anonymous"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {feedbacks.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={isTransitioning}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Previous feedback"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              disabled={isTransitioning}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Next feedback"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dot Indicators */}
      {feedbacks.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {feedbacks.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 ${
                index === currentIndex
                  ? "w-8 h-3 bg-white"
                  : "w-3 h-3 bg-gray-600 hover:bg-gray-400"
              }`}
              aria-label={`Go to feedback ${index + 1}`}
              aria-current={index === currentIndex ? "true" : "false"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
