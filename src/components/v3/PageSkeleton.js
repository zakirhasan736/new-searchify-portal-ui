export default function PageSkeleton() {
  return (
    <div className="sf-skel" aria-busy="true" aria-live="polite">
      <div className="sf-skel-hero">
        <span className="sf-skel-bar sf-skel-label" />
        <span className="sf-skel-bar sf-skel-title" />
        <span className="sf-skel-bar sf-skel-title sf-skel-title-2" />
        <span className="sf-skel-bar sf-skel-copy" />
      </div>
      <div className="sf-three sf-gap">
        <div className="sf-box sf-skel-card">
          <span className="sf-skel-bar" />
          <span className="sf-skel-bar sf-skel-metric" />
        </div>
        <div className="sf-box sf-skel-card">
          <span className="sf-skel-bar" />
          <span className="sf-skel-bar sf-skel-metric" />
        </div>
        <div className="sf-box sf-skel-card">
          <span className="sf-skel-bar" />
          <span className="sf-skel-bar sf-skel-metric" />
        </div>
      </div>
      <div className="sf-box sf-gap">
        <span className="sf-skel-bar sf-skel-wide" />
        <span className="sf-skel-bar" />
        <span className="sf-skel-bar sf-skel-mid" />
        <span className="sf-skel-bar sf-skel-short" />
      </div>
    </div>
  );
}
