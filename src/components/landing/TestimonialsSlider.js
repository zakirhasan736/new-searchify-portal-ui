"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desktop: multi-card slider with dots (no arrows).
 * Mobile: one card + ~10% next peek; floating arrows + drag/swipe + dots.
 */
export default function TestimonialsSlider({ items = [], intervalMs = 5500 }) {
  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragRef = useRef(null);
  const count = items.length;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const maxIndex = mobile ? Math.max(0, count - 1) : Math.max(0, count - 3);
  const pageCount = maxIndex + 1;
  const safeIndex = Math.min(((index % pageCount) + pageCount) % pageCount, maxIndex);

  useEffect(() => {
    setIndex(0);
  }, [mobile, count]);

  useEffect(() => {
    if (paused || pageCount <= 1 || dragRef.current?.active) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % pageCount);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [paused, pageCount, intervalMs]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const card = el.querySelector(".sf-quote-slide");
    if (!card) return undefined;

    const layout = () => {
      const styles = getComputedStyle(el);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || (mobile ? 12 : 16);
      const step = card.offsetWidth + gap;
      el.style.transition = dragRef.current?.active
        ? "none"
        : "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = `translate3d(${-safeIndex * step + dragX}px, 0, 0)`;
    };

    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, [safeIndex, mobile, count, dragX]);

  const indexRef = useRef(safeIndex);
  const pageCountRef = useRef(pageCount);
  indexRef.current = safeIndex;
  pageCountRef.current = pageCount;

  const go = (next) => {
    const total = pageCountRef.current;
    setIndex(((next % total) + total) % total);
  };

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || !mobile) return undefined;

    const finish = (clientX) => {
      const start = dragRef.current;
      if (!start?.active) return;
      const dx = clientX - start.x;
      const threshold = Math.max(40, (node.offsetWidth || 280) * 0.14);
      dragRef.current = { ...start, active: false };
      setDragX(0);
      if (Math.abs(dx) > threshold) {
        const total = pageCountRef.current;
        const current = indexRef.current;
        const next = current + (dx < 0 ? 1 : -1);
        setIndex(((next % total) + total) % total);
      }
      setPaused(false);
    };

    const onPointerDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragRef.current = {
        x: event.clientX,
        y: event.clientY,
        active: true,
        pointerId: event.pointerId,
        locked: false,
      };
      setPaused(true);
      try {
        node.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (event) => {
      const start = dragRef.current;
      if (!start?.active || start.pointerId !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!start.locked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          dragRef.current = { ...start, active: false };
          setDragX(0);
          setPaused(false);
          return;
        }
        dragRef.current = { ...start, locked: true };
      }
      event.preventDefault();
      setDragX(dx);
    };

    const onPointerUp = (event) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      finish(event.clientX);
      try {
        node.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    };

    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointermove", onPointerMove, { passive: false });
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("pointercancel", onPointerUp);
    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerUp);
    };
  }, [mobile]);

  return (
    <div
      className={`sf-quote-slider${mobile ? " is-mobile" : " is-desktop"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="sf-quote-stage">
        {mobile ? (
          <button
            type="button"
            className="sf-quote-arrow sf-quote-arrow-prev"
            aria-label="Previous testimonial"
            onClick={() => go(safeIndex - 1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}

        <div className="sf-quote-viewport" ref={viewportRef}>
          <div className="sf-quote-track" ref={trackRef}>
            {items.map((quote) => (
              <figure key={quote.who + quote.color} className="sf-quote sf-quote-slide">
                <span aria-hidden="true" style={{ color: quote.color }}>
                  “
                </span>
                <blockquote>{quote.text}</blockquote>
                <figcaption>
                  <i />
                  <span>
                    <strong>{quote.who}</strong>
                    <small>{quote.role}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {mobile ? (
          <button
            type="button"
            className="sf-quote-arrow sf-quote-arrow-next"
            aria-label="Next testimonial"
            onClick={() => go(safeIndex + 1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="sf-quote-dots" role="tablist" aria-label="Testimonials">
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === safeIndex}
            aria-label={`Show testimonial ${i + 1}`}
            className={`sf-quote-dot${i === safeIndex ? " is-on" : ""}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
