"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desktop: modern multi-card slider with arrows + dots, soft edge fade.
 * Mobile / tablet: one full card + half of the next/prev peeking.
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

  // Mobile: one card. Desktop: advance by one while showing ~3 cards.
  const maxIndex = mobile ? Math.max(0, count - 1) : Math.max(0, count - 3);
  const pageCount = maxIndex + 1;
  const safeIndex = Math.min(((index % pageCount) + pageCount) % pageCount, maxIndex);

  useEffect(() => {
    setIndex(0);
  }, [mobile, count]);

  useEffect(() => {
    if (paused || pageCount <= 1 || dragRef.current) return undefined;
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
      el.style.transition = dragX ? "none" : "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = `translate3d(${-safeIndex * step + dragX}px, 0, 0)`;
    };

    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, [safeIndex, mobile, count, dragX]);

  const go = (next) => setIndex(((next % pageCount) + pageCount) % pageCount);

  const onPointerDown = (event) => {
    if (!mobile) return;
    const point = event.touches ? event.touches[0] : event;
    dragRef.current = { x: point.clientX, y: point.clientY, active: true };
    setPaused(true);
  };

  const onPointerMove = (event) => {
    if (!dragRef.current?.active) return;
    const point = event.touches ? event.touches[0] : event;
    const dx = point.clientX - dragRef.current.x;
    setDragX(dx);
  };

  const onPointerUp = (event) => {
    if (!dragRef.current?.active) return;
    const point = event.changedTouches ? event.changedTouches[0] : event;
    const dx = point.clientX - dragRef.current.x;
    dragRef.current = null;
    setDragX(0);
    if (Math.abs(dx) > 48) go(safeIndex + (dx < 0 ? 1 : -1));
    setPaused(false);
  };

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
      <div
        className="sf-quote-viewport"
        ref={viewportRef}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
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

      <div className="sf-quote-controls">
        <button
          type="button"
          className="sf-quote-arrow"
          aria-label="Previous testimonial"
          onClick={() => go(safeIndex - 1)}
        >
          ‹
        </button>

        <div className="sf-quote-dots" role="tablist" aria-label="Testimonials">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`Show testimonials group ${i + 1}`}
              className={`sf-quote-dot${i === safeIndex ? " is-on" : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>

        <button
          type="button"
          className="sf-quote-arrow"
          aria-label="Next testimonial"
          onClick={() => go(safeIndex + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
