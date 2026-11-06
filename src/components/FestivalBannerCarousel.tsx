import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  EyeOff
} from 'lucide-react';
import { FestivalBanner, Language } from '../types';
import { getTranslation } from '../translations';

interface FestivalBannerCarouselProps {
  banners: FestivalBanner[];
  lang: Language;
  onSelectCategory?: (category: string) => void;
  onScrollToBumperOffers?: () => void;
  onHide?: () => void;
}

export function FestivalBannerCarousel({
  banners,
  lang,
  onSelectCategory,
  onScrollToBumperOffers,
  onHide
}: FestivalBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  // Guard against empty array
  const activeBanners = banners.length > 0 ? banners : [];
  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  // Auto-slide every 5 seconds (paused on user hover or touch)
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused]);

  if (!currentBanner) return null;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleBannerAction = () => {
    if (currentBanner.categoryTarget && onSelectCategory) {
      onSelectCategory(currentBanner.categoryTarget);
    }
    if (onScrollToBumperOffers) {
      onScrollToBumperOffers();
    } else {
      const section = document.getElementById('bumper-offers-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <section
      id="festival-carousel-section"
      className="w-full relative"
      aria-label="Automatic Festival Banner Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Banner Card */}
      <div
        onClick={handleBannerAction}
        className="group relative w-full h-48 sm:h-64 md:h-72 lg:h-80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-slate-200/90 bg-slate-900 cursor-pointer select-none transition-all duration-300 hover:shadow-xl hover:border-amber-400/60"
      >
        {/* Hide Banner Button */}
        {onHide && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHide();
            }}
            title={t('hideBanner')}
            className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/40 hover:bg-black/75 backdrop-blur-md text-white/90 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <EyeOff className="w-3 h-3 text-white/80" />
            <span className="text-[10px] uppercase tracking-wider">{t('hideBanner')}</span>
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {/* Banner Background Image */}
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.festivalName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.dataset.fallbackApplied) {
                  target.dataset.fallbackApplied = 'true';
                  target.src = '/diwali_festival_banner.jpg';
                }
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Festival Banner"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Festival Banner"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Indicator Dots */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-sm">
            {activeBanners.map((b, idx) => (
              <button
                key={b.id || idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-5 h-1.5 bg-amber-400 shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
