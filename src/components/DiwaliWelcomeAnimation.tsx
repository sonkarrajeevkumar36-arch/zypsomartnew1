import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import defaultAppLogo from '../assets/logo.png';
import { getCurrentISTDate } from '../utils/festivalScheduler';

const SESSION_KEY = 'zypsomart_diwali_welcome_shown_v1';

/**
 * Returns true if the current IST date falls within the Diwali festive season (Oct 10 - Nov 25)
 * or if URL override ?diwali=true / #diwali is present.
 */
export function isDiwaliFestivalPeriod(): boolean {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('diwali') === 'true' || window.location.hash.includes('diwali')) {
      return true;
    }
  }

  const { month, day } = getCurrentISTDate();
  // Diwali season window: mid-October through late November
  if (month === 10 && day >= 10) return true;
  if (month === 11 && day <= 25) return true;
  return false;
}

/**
 * Checks if the Diwali welcome animation should display for this session
 */
export function shouldShowDiwaliWelcome(): boolean {
  if (typeof window === 'undefined') return false;

  // Respect user's accessibility reduced-motion preference
  try {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return false;
  } catch {}

  // Check URL test override: ?force_diwali=true forces animation even if previously shown in session
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('force_diwali') === 'true') {
      return true;
    }
    const alreadyShown = sessionStorage.getItem(SESSION_KEY) === 'true';
    if (alreadyShown) return false;
  } catch {
    return false;
  }

  return isDiwaliFestivalPeriod();
}

/**
 * Marks that the Diwali welcome celebration has been shown for the current session
 */
export function markDiwaliWelcomeShown(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {}
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  gravity: number;
  flicker: boolean;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
  isExploded: boolean;
}

interface Sparkler {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
}

const FESTIVE_PALETTE = [
  '#fbbf24', // Golden yellow
  '#f59e0b', // Deep Amber
  '#ea580c', // Bright saffron
  '#ef4444', // Vermillion festive red
  '#10b981', // Emerald green
  '#a855f7', // Royal purple
  '#38bdf8', // Electric turquoise
  '#ffffff', // Diamond sparkle
  '#fde047'  // Glowing lemon gold
];

interface DiwaliWelcomeAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'hi';
}

export function DiwaliWelcomeAnimation({
  isOpen,
  onClose,
  lang = 'en'
}: DiwaliWelcomeAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const handleDismiss = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    markDiwaliWelcomeShown();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    markDiwaliWelcomeShown();

    // Auto dismiss after 2.8 seconds
    const duration = 2800;
    const intervalStep = 50;
    const increment = (intervalStep / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + increment;
      });
    }, intervalStep);

    autoCloseTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [isOpen, handleDismiss]);

  // Setup Canvas Fireworks & Rocket Simulation
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const isMobile = width < 640;
    const maxParticles = isMobile ? 32 : 55;
    const maxRockets = isMobile ? 2 : 4;

    const rockets: Rocket[] = [];
    const particles: Particle[] = [];
    const sparklers: Sparkler[] = [];

    // Sound alert: gentle low-volume festive synth chime
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.35); // C6
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {}

    const spawnRocket = () => {
      if (rockets.length >= maxRockets) return;
      const x = Math.random() * (width * 0.7) + width * 0.15;
      const targetY = Math.random() * (height * 0.35) + height * 0.12;
      const color = FESTIVE_PALETTE[Math.floor(Math.random() * FESTIVE_PALETTE.length)];
      rockets.push({
        x,
        y: height + 10,
        targetY,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -(Math.random() * 3 + (isMobile ? 12 : 14)),
        color,
        trail: [],
        isExploded: false
      });
    };

    const explodeRocket = (rocket: Rocket) => {
      const count = maxParticles;
      const baseColor = rocket.color;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = Math.random() * (isMobile ? 4.5 : 6.5) + 1.5;
        const particleColor = Math.random() > 0.3
          ? baseColor
          : FESTIVE_PALETTE[Math.floor(Math.random() * FESTIVE_PALETTE.length)];

        particles.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: particleColor,
          alpha: 1,
          decay: Math.random() * 0.018 + 0.014,
          size: Math.random() * 2.5 + 1.5,
          gravity: 0.08,
          flicker: Math.random() > 0.5
        });
      }

      // Add a flash ring
      for (let j = 0; j < 8; j++) {
        sparklers.push({
          x: rocket.x,
          y: rocket.y,
          vx: (Math.random() - 0.5) * 7,
          vy: (Math.random() - 0.5) * 7,
          alpha: 1,
          decay: 0.05,
          color: '#ffffff',
          size: 2
        });
      }
    };

    // Initial rockets salvo
    spawnRocket();
    setTimeout(spawnRocket, 180);
    setTimeout(spawnRocket, 450);

    let frameCount = 0;

    const render = () => {
      frameCount++;

      // Subtle translucent clear for glowing motion trails
      ctx.fillStyle = 'rgba(10, 4, 18, 0.24)';
      ctx.fillRect(0, 0, width, height);

      // Periodically launch rockets
      if (frameCount % (isMobile ? 24 : 18) === 0 && rockets.length < maxRockets) {
        spawnRocket();
      }

      // Ground sparklers (anaar fountain on bottom corners)
      if (frameCount % 3 === 0) {
        const leftX = width * 0.08;
        const rightX = width * 0.92;
        const groundY = height - 15;

        for (const sx of [leftX, rightX]) {
          sparklers.push({
            x: sx + (Math.random() - 0.5) * 20,
            y: groundY,
            vx: (Math.random() - 0.5) * 3 + (sx < width / 2 ? 0.8 : -0.8),
            vy: -(Math.random() * 5 + 3),
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02,
            color: Math.random() > 0.4 ? '#fbbf24' : '#f59e0b',
            size: Math.random() * 2 + 1
          });
        }
      }

      // Update and draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.06; // subtle gravity

        r.trail.push({ x: r.x, y: r.y, alpha: 1 });
        if (r.trail.length > 7) r.trail.shift();

        // Draw trail
        for (let t = 0; t < r.trail.length; t++) {
          const pt = r.trail[t];
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.8 * (t / r.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 191, 36, ${0.4 * (t / r.trail.length)})`;
          ctx.fill();
        }

        // Rocket head
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Check explosion
        if (r.y <= r.targetY || r.vy >= -1) {
          explodeRocket(r);
          rockets.splice(i, 1);
        }
      }

      // Update and draw fireworks particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.flicker && Math.random() > 0.4 ? p.alpha * 0.6 : p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      // Update and draw sparklers
      for (let i = sparklers.length - 1; i >= 0; i--) {
        const s = sparklers[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.12;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparklers.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="diwali-welcome-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.03 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-between overflow-hidden select-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, #1e1105 0%, #0c0514 60%, #030108 100%)'
        }}
      >
        {/* HTML5 Canvas for high-performance 60fps Rockets & Fireworks */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Top Floating Golden Lights & Toran */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none flex justify-around px-4 pt-1 overflow-hidden opacity-90">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`light-${i}`}
              animate={{
                opacity: [0.5, 1, 0.6],
                scale: [0.9, 1.15, 0.95],
                y: [0, (i % 2 === 0 ? 3 : 5), 0]
              }}
              transition={{
                duration: 1.6 + (i % 4) * 0.3,
                repeat: Infinity,
                delay: i * 0.12,
                ease: 'easeInOut'
              }}
              className="flex flex-col items-center"
            >
              {/* String */}
              <div className="w-[1px] h-3 sm:h-5 bg-amber-400/40" />
              {/* Bulb */}
              <div
                className={`w-2.5 h-3 sm:w-3 sm:h-4 rounded-full shadow-lg ${
                  i % 3 === 0
                    ? 'bg-amber-400 shadow-amber-400/80 ring-2 ring-amber-300/40'
                    : i % 3 === 1
                    ? 'bg-orange-500 shadow-orange-500/80 ring-2 ring-orange-300/40'
                    : 'bg-emerald-400 shadow-emerald-400/80 ring-2 ring-emerald-300/40'
                }`}
              />
            </motion.div>
          ))}
        </div>

        {/* Top Header Row with Skip Button & Timer indicator */}
        <div className="w-full flex items-center justify-between px-5 pt-5 z-30">
          {/* Festive Badge */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 backdrop-blur-md shadow-lg shadow-amber-500/10 text-amber-300 text-[11px] font-black uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{lang === 'hi' ? 'दीपावली महोत्सव 🪔' : 'Diwali Dhamaka 🪔'}</span>
          </motion.div>

          {/* Skip Button */}
          <motion.button
            type="button"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            onClick={handleDismiss}
            aria-label="Skip Diwali welcome animation"
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 text-xs font-bold border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>{lang === 'hi' ? 'छोड़ें' : 'Skip'}</span>
            <X className="w-3.5 h-3.5 text-white/80" />
          </motion.button>
        </div>

        {/* Floating Festive Elements (Sweets, Sparkles, Diyas) */}
        <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
          {/* Sweet: Laddoo */}
          <motion.div
            animate={{
              y: ['100vh', '-10vh'],
              x: ['10vw', '15vw'],
              rotate: [0, 180]
            }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'linear', delay: 0.2 }}
            className="absolute text-2xl filter drop-shadow-lg"
          >
            🟡
          </motion.div>

          {/* Sweet: Kaju Katli / Diamond */}
          <motion.div
            animate={{
              y: ['100vh', '-10vh'],
              x: ['80vw', '75vw'],
              rotate: [0, -220]
            }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'linear', delay: 0.6 }}
            className="absolute text-2xl filter drop-shadow-lg"
          >
            🔷
          </motion.div>

          {/* Floating Diya */}
          <motion.div
            animate={{
              y: ['100vh', '-10vh'],
              x: ['25vw', '30vw'],
              scale: [0.8, 1.1, 0.9]
            }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'linear', delay: 1.1 }}
            className="absolute text-3xl filter drop-shadow-xl"
          >
            🪔
          </motion.div>

          {/* Floating Sparkler */}
          <motion.div
            animate={{
              y: ['100vh', '-10vh'],
              x: ['70vw', '65vw'],
              rotate: [0, 360]
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'linear', delay: 1.4 }}
            className="absolute text-2xl filter drop-shadow-lg"
          >
            ✨
          </motion.div>
        </div>

        {/* Central Festive Greeting Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', damping: 20 }}
          className="relative z-30 max-w-sm sm:max-w-md w-11/12 mx-auto text-center px-6 py-7 sm:py-8 rounded-3xl bg-slate-900/80 border-2 border-amber-400/50 shadow-2xl shadow-amber-500/25 backdrop-blur-xl flex flex-col items-center"
        >
          {/* Glowing Aura Ring */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-amber-500/30 rounded-3xl blur-xl -z-10 animate-pulse" />

          {/* App Logo with Festive Gold Frame */}
          <motion.div
            animate={{
              scale: [1, 1.06, 1],
              rotate: [0, 1.5, -1.5, 0]
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-b from-amber-100 to-white p-2 border-2 border-amber-300 shadow-xl shadow-amber-400/30 flex items-center justify-center mb-4 relative"
          >
            <img
              src={defaultAppLogo}
              alt="Zypsomart"
              className="w-full h-full object-contain"
            />
            {/* Corner Sparkle */}
            <span className="absolute -top-2 -right-2 text-base animate-bounce">
              ✨
            </span>
          </motion.div>

          {/* Festive Greetings Headline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-1.5"
          >
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 drop-shadow-md">
              Happy Diwali!
            </h1>
            <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center justify-center gap-1.5">
              <span>Celebrate with Zypsomart</span>
              <span className="text-xl">🪔</span>
            </h2>
          </motion.div>

          {/* Subtitle / Delivery Promise */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-xs sm:text-sm text-amber-100/80 font-medium max-w-xs mt-3 leading-relaxed"
          >
            {lang === 'hi'
              ? 'मिठाइयां, पूजा सामग्री और ताज़ा किराना सिर्फ 20 मिनट में आपके घर!'
              : 'Fresh Sweets, Festive Dry Fruits & Puja Essentials delivered in 20 minutes!'}
          </motion.p>

          {/* Enter Home CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={handleDismiss}
            className="mt-5 w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-98 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
          >
            <span>{lang === 'hi' ? 'दुकान में प्रवेश करें' : 'Start Festive Shopping'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </motion.button>
        </motion.div>

        {/* Bottom Festive Row: Glowing Diyas with Flickering Flames */}
        <div className="w-full flex items-end justify-between px-6 sm:px-12 pb-6 z-30">
          {/* Left Diya */}
          <div className="flex flex-col items-center">
            {/* Flickering Flame */}
            <motion.div
              animate={{
                scaleY: [1, 1.25, 0.95, 1.15, 1],
                scaleX: [1, 0.9, 1.1, 0.95, 1],
                opacity: [0.85, 1, 0.9, 1, 0.85]
              }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-3.5 h-6 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-200 blur-[0.5px] shadow-lg shadow-amber-400/80 -mb-1"
            />
            {/* Diya Clay Base */}
            <div className="w-10 sm:w-12 h-3.5 bg-gradient-to-r from-amber-800 via-orange-700 to-amber-900 rounded-b-full border-t border-amber-500/40 shadow-xl shadow-amber-600/40" />
          </div>

          {/* Center Progress Bar / Timer */}
          <div className="flex flex-col items-center gap-1.5 max-w-[140px] w-full">
            <span className="text-[10px] font-bold text-amber-300/70 uppercase tracking-widest">
              {lang === 'hi' ? 'लोड हो रहा है...' : 'Entering Shop...'}
            </span>
            <div className="w-full h-1 bg-amber-950/60 rounded-full overflow-hidden border border-amber-500/20">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-75 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Right Diya */}
          <div className="flex flex-col items-center">
            {/* Flickering Flame */}
            <motion.div
              animate={{
                scaleY: [1, 1.18, 0.92, 1.25, 1],
                scaleX: [1, 0.92, 1.08, 0.9, 1],
                opacity: [0.9, 1, 0.85, 1, 0.9]
              }}
              transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="w-3.5 h-6 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-200 blur-[0.5px] shadow-lg shadow-amber-400/80 -mb-1"
            />
            {/* Diya Clay Base */}
            <div className="w-10 sm:w-12 h-3.5 bg-gradient-to-r from-amber-800 via-orange-700 to-amber-900 rounded-b-full border-t border-amber-500/40 shadow-xl shadow-amber-600/40" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
