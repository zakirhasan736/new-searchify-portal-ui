/** Client brand mark — six status dots with soft glow (searchify-logo-A). */
export default function SearchifyMark({ size = 30, title = "Searchify" }) {
  const filterId = `sf-mark-glow-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={title} style={{ flex: "none" }}>
      <defs>
        <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodOpacity="0.9" floodColor="currentColor" />
        </filter>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#131519" stroke="#2E333B" strokeWidth="0.6" />
      <circle cx="9" cy="12.5" r="2.9" fill="#FF5A4E" style={{ color: "#FF5A4E" }} filter={`url(#${filterId})`} />
      <circle cx="16" cy="12.5" r="2.9" fill="#FF9F43" style={{ color: "#FF9F43" }} filter={`url(#${filterId})`} />
      <circle cx="23" cy="12.5" r="2.9" fill="#FFC53D" style={{ color: "#FFC53D" }} filter={`url(#${filterId})`} />
      <circle cx="9" cy="19.5" r="2.9" fill="#3DDC84" style={{ color: "#3DDC84" }} filter={`url(#${filterId})`} />
      <circle cx="16" cy="19.5" r="2.9" fill="#2CC7C0" style={{ color: "#2CC7C0" }} filter={`url(#${filterId})`} />
      <circle cx="23" cy="19.5" r="2.9" fill="#4DA3FF" style={{ color: "#4DA3FF" }} filter={`url(#${filterId})`} />
    </svg>
  );
}
