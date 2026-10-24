/** V8 brand mark — six status dots in a rounded tile. */
export default function SearchifyMark({ size = 30, title = "Searchify" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={title} style={{ flex: "none" }}>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#131519" stroke="#2E333B" />
      <circle cx="9" cy="12.5" r="2.9" fill="#FF5A4E" />
      <circle cx="16" cy="12.5" r="2.9" fill="#FF9F43" />
      <circle cx="23" cy="12.5" r="2.9" fill="#FFC53D" />
      <circle cx="9" cy="19.5" r="2.9" fill="#3DDC84" />
      <circle cx="16" cy="19.5" r="2.9" fill="#2CC7C0" />
      <circle cx="23" cy="19.5" r="2.9" fill="#4DA3FF" />
    </svg>
  );
}
