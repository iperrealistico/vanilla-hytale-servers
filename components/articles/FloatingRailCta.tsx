"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';

type FloatingRailCtaProps = {
  eyebrow: string;
  title: string;
  body: string;
  primaryCta: {
    href: string;
    label: string;
    variant: 'primary' | 'secondary';
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function FloatingRailCta({ eyebrow, title, body, primaryCta }: FloatingRailCtaProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const targetOffsetRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const maxOffsetRef = useRef(0);
  const scrollStartRef = useRef(0);
  const scrollSpanRef = useRef(1);
  const desktopMediaRef = useRef<MediaQueryList | null>(null);
  const reducedMotionMediaRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    const card = cardRef.current;

    if (!rail || !card) {
      return;
    }

    const desktopMedia = window.matchMedia('(min-width: 1001px)');
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    desktopMediaRef.current = desktopMedia;
    reducedMotionMediaRef.current = reducedMotionMedia;

    const setCardOffset = (offset: number) => {
      card.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };

    const refreshTarget = () => {
      if (!desktopMedia.matches) {
        targetOffsetRef.current = 0;
        return;
      }

      const maxOffset = maxOffsetRef.current;
      if (maxOffset <= 0) {
        targetOffsetRef.current = 0;
        return;
      }

      const progress = clamp((window.scrollY - scrollStartRef.current) / scrollSpanRef.current, 0, 1);
      targetOffsetRef.current = progress * maxOffset;
    };

    const animate = () => {
      frameRef.current = null;

      const target = targetOffsetRef.current;
      if (reducedMotionMedia.matches) {
        currentOffsetRef.current = target;
        setCardOffset(target);
        return;
      }

      const maxOffset = maxOffsetRef.current;
      const current = currentOffsetRef.current;
      const delta = target - current;
      const next = clamp(Math.abs(delta) < 0.35 ? target : current + delta * 0.14, 0, maxOffset);

      currentOffsetRef.current = next;
      setCardOffset(next);

      if (Math.abs(target - next) > 0.35) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    };

    const schedule = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    };

    const recalculateBounds = () => {
      if (!desktopMedia.matches) {
        maxOffsetRef.current = 0;
        scrollStartRef.current = 0;
        scrollSpanRef.current = 1;
        targetOffsetRef.current = 0;
        currentOffsetRef.current = 0;
        setCardOffset(0);
        return;
      }

      const railRect = rail.getBoundingClientRect();
      const railTop = window.scrollY + railRect.top;
      const railHeight = rail.offsetHeight;
      const cardHeight = card.offsetHeight;
      const maxOffset = Math.max(railHeight - cardHeight, 0);
      const scrollSpan = Math.max(maxOffset * 0.82, window.innerHeight * 0.8, 1);

      maxOffsetRef.current = maxOffset;
      scrollStartRef.current = Math.max(railTop - window.innerHeight * 0.12, 0);
      scrollSpanRef.current = scrollSpan;
      currentOffsetRef.current = clamp(currentOffsetRef.current, 0, maxOffset);

      refreshTarget();

      if (reducedMotionMedia.matches) {
        currentOffsetRef.current = targetOffsetRef.current;
        setCardOffset(targetOffsetRef.current);
        return;
      }

      schedule();
    };

    const handleScroll = () => {
      refreshTarget();
      schedule();
    };

    const handleViewportChange = () => {
      recalculateBounds();
    };

    const resizeObserver = new ResizeObserver(() => {
      recalculateBounds();
    });

    resizeObserver.observe(rail);
    resizeObserver.observe(card);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleViewportChange);
    desktopMedia.addEventListener('change', handleViewportChange);
    reducedMotionMedia.addEventListener('change', handleViewportChange);

    recalculateBounds();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleViewportChange);
      desktopMedia.removeEventListener('change', handleViewportChange);
      reducedMotionMedia.removeEventListener('change', handleViewportChange);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div className="article-floating-rail" ref={railRef}>
      <div className="panel article-sticky-cta article-floating-cta" ref={cardRef}>
        <span className="editorial-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        <Link className={`btn ${primaryCta.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} pressable`} href={primaryCta.href}>
          {primaryCta.label}
        </Link>
      </div>
    </div>
  );
}
