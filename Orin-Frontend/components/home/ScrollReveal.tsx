'use client';

import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react';
import { motion, useInView } from 'framer-motion';

/* ── Hook: usePrefersReducedMotion ──────────────────────── */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/* ── ScrollReveal ───────────────────────────────────────── */\ninterface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  once?: boolean;
  threshold?: number;
  as?: ElementType;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.7,
  once = true,
  threshold = 0.1,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If user prefers reduced motion, show content immediately
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold, prefersReducedMotion]);

  const getTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(40px)';
      case 'down': return 'translateY(-40px)';
      case 'left': return 'translateX(40px)';
      case 'right': return 'translateX(-40px)';
      case 'none': return 'none';
      default: return 'translateY(40px)';
    }
  };

  const springTransition = `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`;

  return (
    <Tag
      ref={ref as React.Ref<any>}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : getTransform(),
        transition: prefersReducedMotion ? 'none' : springTransition,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}

// Framer Motion Wrapper for more complex spring animations
export function MotionReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.7,
  threshold = 0.1,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  const prefersReducedMotion = usePrefersReducedMotion();

  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 60, filter: 'blur(8px)' };
      case 'down': return { opacity: 0, y: -60, filter: 'blur(8px)' };
      case 'left': return { opacity: 0, x: 60, filter: 'blur(8px)' };
      case 'right': return { opacity: 0, x: -60, filter: 'blur(8px)' };
      default: return { opacity: 0, y: 60, filter: 'blur(8px)' };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' } : getInitial()}
      animate={isInView ? { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' } : getInitial()}
      transition={prefersReducedMotion ? { duration: 0 } : {
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
}
