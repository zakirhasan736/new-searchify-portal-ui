"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desktop: 3 cards visible, auto-advance by page, dots only (no arrows).
 * Mobile: one card + ~30% peek of next; arrows + dots.
 */
export default function TestimonialsSlider({ items = [], intervalMs = 5000 }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const pageCount = mobile ? count : Math.max(1, Math.ceil(count / 3));
  const safeIndex = ((index % pageCount) + pageCount) % pageCount;

  useEffect(() => {
    setIndex(0);
  }, [mobile, count]);

  useEffect(() => {
    if (paused || pageCount <= 1) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % pageCount);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [paused, pageCount, intervalMs]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(".sf-quote-slide");
    if (!card) return;
    const gap = mobile ? 12 : 16;
    const step = mobile
      ? card.offsetWidth + gap
      : (card.offsetWidth + gap) * 3;
    el.style.transform = `translateX(-${safeIndex * step}px)`;
  }, [safeIndex, mobile, count]);

  const go = (next) => setIndex(((next % pageCount) + pageCount) % pageCount);

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
      <div className="sf-quote-viewport">
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
        {mobile ? (
          <button
            type="button"
            className="sf-quote-arrow"
            aria-label="Previous testimonial"
            onClick={() => go(safeIndex - 1)}
          >
            ‹
          </button>
        ) : null}

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

        {mobile ? (
          <button
            type="button"
            className="sf-quote-arrow"
            aria-label="Next testimonial"
            onClick={() => go(safeIndex + 1)}
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
  );
}
