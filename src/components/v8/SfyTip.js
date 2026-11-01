"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const EDGE = 12;
const GAP = 8;
const POP_W = 280;
const OPEN_EVENT = "sfy-tip-open";

function clamp(n, min, max) {
  return Math.max(min, Math.min(n, max));
}

function measurePlacement(anchor, pop) {
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(POP_W, vw - EDGE * 2);
  const height = pop?.offsetHeight || 150;
  const spaceBelow = vh - rect.bottom - EDGE;
  const spaceAbove = rect.top - EDGE;
  const preferBelow = spaceBelow >= height + GAP || spaceBelow >= spaceAbove;

  let top;
  let placeY = "below";
  if (preferBelow) {
    top = rect.bottom + GAP;
    placeY = "below";
    if (top + height > vh - EDGE) top = clamp(vh - EDGE - height, EDGE, vh - EDGE);
  } else {
    top = rect.top - GAP - height;
    placeY = "above";
    if (top < EDGE) top = EDGE;
  }

  // Prefer aligning to the trigger; flip so the card stays in the viewport.
  let left = rect.left;
  let placeX = "l";
  if (left + width > vw - EDGE) {
    left = rect.right - width;
    placeX = "r";
  }
  if (left < EDGE) {
    left = EDGE;
    placeX = "c";
  }
  if (left + width > vw - EDGE) left = vw - EDGE - width;

  // Arrow points toward the trigger center when possible.
  const triggerMid = rect.left + rect.width / 2;
  const arrow = clamp(triggerMid - left, 16, width - 16);

  return {
    top: Math.round(top),
    left: Math.round(left),
    width: Math.round(width),
    placeY,
    placeX,
    arrow: Math.round(arrow),
  };
}

/**
 * Smart info `i` tip — fixed portal popup that flips above/below and left/right
 * so it never clips under overflow parents or hangs off-screen.
 */
export default function SfyTip({ tipId, term, text, href, preferredAlign = "l" }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const closeTimer = useRef(null);
  const reactId = useId();
  const instanceId = tipId || reactId.replace(/:/g, "");
  const popId = `tip-${instanceId}`;

  useEffect(() => setMounted(true), []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
    setPin(false);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setPin(false);
      closeTimer.current = null;
    }, 160);
  }, [clearCloseTimer]);

  const openTip = useCallback((pinned = false) => {
    clearCloseTimer();
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { id: instanceId } }));
    setOpen(true);
    setPin(pinned);
  }, [instanceId, clearCloseTimer]);

  const reposition = useCallback(() => {
    if (!btnRef.current || !open) return;
    setPos(measurePlacement(btnRef.current, popRef.current));
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    reposition();
    // Second pass after card paints so height is accurate.
    const raf = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(raf);
  }, [open, text, reposition]);

  useEffect(() => {
    if (!open) return undefined;
    const onOther = (e) => {
      if (e.detail?.id !== instanceId) close();
    };
    const onDoc = (e) => {
      const t = e.target;
      if (wrapRef.current?.contains(t) || popRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    const onScroll = () => reposition();
    window.addEventListener(OPEN_EVENT, onOther);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOther);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, instanceId, close, reposition]);

  if (!term || !text) return null;

  const popup =
    open && mounted
      ? createPortal(
          <span
            ref={popRef}
            className={`sfy-pop sfy-pop-fixed sfy-pop-${pos?.placeY || "below"} sfy-pop-x-${pos?.placeX || preferredAlign}`}
            id={popId}
            role="dialog"
            aria-label={`What is ${term}?`}
            style={
              pos
                ? {
                    top: pos.top,
                    left: pos.left,
                    width: pos.width,
                    ["--sfy-arrow"]: `${pos.arrow}px`,
                  }
                : { visibility: "hidden", top: 0, left: 0 }
            }
            onMouseEnter={() => {
              clearCloseTimer();
              if (!pin) setOpen(true);
            }}
            onMouseLeave={() => {
              if (!pin) scheduleClose();
            }}
          >
            <span className="sfy-pop-card">
              <span>{text}</span>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer">
                  Learn more
                </a>
              ) : null}
            </span>
          </span>,
          document.body,
        )
      : null;

  return (
    <span
      ref={wrapRef}
      className="sfy-tip"
      onMouseEnter={() => {
        if (!pin) openTip(false);
      }}
      onMouseLeave={() => {
        if (!pin) scheduleClose();
      }}
    >
      <button
        ref={btnRef}
        type="button"
        className="sfy-i"
        aria-label={`What is ${term}?`}
        aria-expanded={open}
        aria-controls={popId}
        onFocus={() => {
          if (!open) openTip(false);
        }}
        onBlur={(e) => {
          if (wrapRef.current?.contains(e.relatedTarget) || popRef.current?.contains(e.relatedTarget)) return;
          close();
        }}
        onClick={() => {
          if (open && pin) close();
          else openTip(true);
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M12 11v7" />
          <path d="M12 6.5h.01" />
        </svg>
      </button>
      {popup}
    </span>
  );
}
