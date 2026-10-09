"use client";

import { useState } from "react";
import Link from "next/link";
import LandingShell from "@/components/landing/LandingShell";

const STEP_NAMES = ["Find", "Understand", "Recommend", "Approve", "Execute", "Verify", "Monitor"];

const STAGES = [
  {
    title: "Know which page to work on next.",
    desc: "Searchify brings search queries and existing page metadata into a work queue, so each recommendation starts with something you can inspect.",
  },
  {
    title: "Understand the opportunity in context.",
    desc: "Check what people searched for, what the page says, and which services the business actually offers. Keep missing information visible.",
  },
  {
    title: "Start with a draft that knows the business.",
    desc: "Generate a title and description from the page, search evidence and approved business facts. Edit the wording before anything is approved.",
  },
  {
    title: "Your approval is the turning point.",
    desc: "Compare old and new values, check the selected site, and approve the exact version. Changing the draft means reviewing it again.",
  },
  {
    title: "Publish the version you approved.",
    desc: "Send the approved metadata to the supported WordPress site. An intervening edit should stop the job and send it back for review.",
  },
  {
    title: "Check the page, not just the response.",
    desc: "Fetch the live page and check that the approved values are present. A mismatch stays visible. This verifies the website, not Google’s search listing.",
  },
  {
    title: "Keep the change connected to what follows.",
    desc: "Track search performance alongside the work completed. See dates, data freshness and changes over time, without treating every traffic movement as proof of impact.",
  },
];

function WalkVisual({ step, onApprove }) {
  if (step === 0) {
    return (
      <>
        <div className="eyebrow">OPPORTUNITY DETECTED</div>
        <div className="mockfield">
          <small>Page</small>
          <strong>/services/drain-cleaning</strong>
        </div>
        <div className="mockfield">
          <small>Current title</small>
          <strong>Drain Cleaning | Northline</strong>
        </div>
        <div className="factrow">
          <div className="fact">
            <b>1,240</b>
            <small>Search impressions</small>
          </div>
          <div className="fact">
            <b>28 days</b>
            <small>Evidence window</small>
          </div>
        </div>
      </>
    );
  }
  if (step === 1) {
    return (
      <>
        <div className="eyebrow">THE EVIDENCE BEHIND THE TASK</div>
        <div className="mockfield">
          <small>Relevant search query</small>
          <strong>drain cleaning Calgary</strong>
        </div>
        <div className="mockfield">
          <small>Confirmed business facts</small>
          <strong>Drain cleaning · Calgary · Residential service</strong>
        </div>
        <div className="mockfield">
          <small>Why review this page?</small>
          <strong>The title does not name the confirmed service area.</strong>
        </div>
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        <div className="eyebrow">SUGGESTED SEARCH LISTING</div>
        <div className="mockfield">
          <small>Title</small>
          <strong className="draft-title">Drain Cleaning in Calgary | Northline Plumbing</strong>
        </div>
        <div className="mockfield">
          <small>Description</small>
          <strong className="draft-desc">
            Get help with blocked drains in your Calgary home. Explore Northline Plumbing’s drain-cleaning services and contact the team to book.
          </strong>
        </div>
        <div className="capsule spaced">Draft ready for human review</div>
      </>
    );
  }
  if (step === 3) {
    return (
      <>
        <div className="eyebrow">FINAL REVIEW</div>
        <ul className="checklist">
          <li>Correct site: Northline Plumbing</li>
          <li>Correct page: /services/drain-cleaning</li>
          <li>Only the meta title and meta description will change</li>
        </ul>
        <button id="approve-demo" className="btn primary small approve-demo" type="button" onClick={onApprove}>
          Approve this example
        </button>
      </>
    );
  }
  if (step === 4) {
    return (
      <>
        <div className="eyebrow">APPROVED CHANGE / SAMPLE</div>
        <div className="mockfield">
          <small>Destination</small>
          <strong>Northline Plumbing · WordPress</strong>
        </div>
        <ul className="checklist">
          <li>Source values checked</li>
          <li>Approved title saved</li>
          <li>Approved description saved</li>
        </ul>
        <span className="pill spaced">READY FOR VERIFICATION</span>
      </>
    );
  }
  if (step === 5) {
    return (
      <>
        <div className="bigcheck">✓</div>
        <div className="eyebrow">LIVE PAGE VERIFIED / SAMPLE</div>
        <div className="mockfield matched">
          <strong>Approved values match the page.</strong>
          <small>Title matched · Description matched</small>
        </div>
        <div className="capsule loose">Before and after values saved in change history</div>
      </>
    );
  }
  return (
    <>
      <div className="eyebrow">MONITORING / SAMPLE</div>
      <div className="mockfield">
        <small>Update recorded</small>
        <strong>Drain-cleaning title and description</strong>
      </div>
      <div className="mockfield">
        <small>Search performance</small>
        <strong>Awaiting the next Search Console sync</strong>
      </div>
      <div className="mockfield">
        <small>Client work record</small>
        <strong>Approved · Published · Verified</strong>
      </div>
    </>
  );
}

export default function HomeView() {
  const [step, setStep] = useState(0);
  const stage = STAGES[step];

  const show = (index, focus = false) => {
    const next = (index + STAGES.length) % STAGES.length;
    setStep(next);
    if (focus) {
      requestAnimationFrame(() => document.getElementById(`step-${next}`)?.focus());
    }
  };

  const openReview = () => {
    show(2);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("how")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    document.getElementById("walk-panel")?.focus({ preventScroll: true });
  };

  const onTabKey = (event) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") show(0, true);
    else if (event.key === "End") show(6, true);
    else show(step + (event.key === "ArrowRight" ? 1 : -1), true);
  };

  return (
    <LandingShell current="home" footerNote="Searchify · Fully developed · 2026">
      <main id="top">
        <div className="wrap">
          <div className="hero reveal">
            <div className="eyebrow">
              <span className="bar" /> YOUR WORDPRESS SEO WORKSPACE <span className="bar" />
            </div>
            <h1>
              SEO THAT
              <br />
              <em>GETS DONE.</em>
            </h1>
            <p>
              Find what needs improving. Review the recommendation.
              <br />
              Publish approved changes and see what happened.
              <br />
              All in one workspace.
            </p>
            <div className="actions">
              <a className="btn primary" href="#how">
                See how Searchify works
              </a>
              <Link className="btn" href="/signup">
                <span className="play" aria-hidden="true">
                  ▶
                </span>
                Explore the product
              </Link>
            </div>
            <div className="micro">WordPress first. Your approval before every live change.</div>
            <div className="hero-floor">
              <div className="app">
                <div className="apptop">
                  <div className="dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>Searchify / Agency workspace</span>
                  <span>Fully developed</span>
                </div>
                <div className="appbody">
                  <aside className="sidebar" aria-hidden="true">
                    <div className="brand">
                      <span className="mark">s</span>searchify
                    </div>
                    <div className="sidelabel">WORKSPACE</div>
                    <div className="sideitem">Overview</div>
                    <div className="sideitem active">Work queue</div>
                    <div className="sideitem">Performance</div>
                    <div className="sideitem">Reports</div>
                    <div className="sidelabel">SETTINGS</div>
                    <div className="sideitem">Connections</div>
                    <div className="sideitem">Business profile</div>
                  </aside>
                  <div className="appmain">
                    <div className="apphead">
                      <span>Northline Plumbing / Calgary</span>
                      <span className="pill">WORDPRESS + SEARCH CONSOLE</span>
                    </div>
                    <h3>Your next move.</h3>
                    <p>Three suggested updates. You choose what goes live.</p>
                    <div className="queue">
                      <div className="queuehead">
                        <strong>Give your service pages a clearer introduction.</strong>
                        <span>3 ready for review</span>
                      </div>
                      <div className="queueitem">
                        <div>
                          Make the drain-cleaning title more specific
                          <small>/services/drain-cleaning</small>
                        </div>
                        <button className="mini review" type="button" onClick={openReview}>
                          Review
                        </button>
                      </div>
                      <div className="queueitem">
                        <div>
                          Clarify the water-heater service description
                          <small>/services/water-heaters</small>
                        </div>
                        <button className="mini review" type="button" onClick={openReview}>
                          Review
                        </button>
                      </div>
                      <div className="queueitem">
                        <div>
                          Add a missing plumbing-repairs description
                          <small>/services/repairs</small>
                        </div>
                        <button className="mini review" type="button" onClick={openReview}>
                          Review
                        </button>
                      </div>
                    </div>
                    <div className="metrics">
                      <div className="metric">
                        <small>Organic clicks · 28 days</small>
                        <b>428</b>
                        <span>Search Console data</span>
                      </div>
                      <div className="metric">
                        <small>Updates verified</small>
                        <b>12</b>
                        <span>Approved by your team</span>
                      </div>
                      <div className="metric">
                        <small>Pages monitored</small>
                        <b>18</b>
                        <span>Last checked today</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="appcaption">
                <span>One workspace. From opportunity to verified update.</span>
                <span>Illustrative data · Northline Plumbing</span>
              </div>
            </div>
            <div className="connections">
              <p>Bring your site, search data and business context together.</p>
              <div className="logos">
                <div>
                  <span className="logoicon">W</span>WordPress
                </div>
                <div>
                  <span className="logoicon g">G</span>Search Console
                </div>
                <div>
                  <span className="logoicon dfs">S</span>Searchify SEO
                </div>
                <div>
                  <span className="logoicon dfs">✳</span>AI recommendations
                </div>
              </div>
            </div>
          </div>
        </div>
        <section id="how" className="workflow">
          <div className="wrap">
            <div className="sectionhead">
              <div>
                <div className="eyebrow">01 / FROM OPPORTUNITY TO ACTION</div>
                <h2>
                  LESS CHASING.
                  <br />
                  <span className="green">MORE COMPLETING.</span>
                </h2>
              </div>
              <p>A clear next action, the evidence behind it, and a controlled path to getting it live. Follow a sample update through Searchify.</p>
            </div>
            <div className="steps" role="tablist" aria-label="SEO workflow stages">
              {STEP_NAMES.map((name, index) => (
                <button
                  key={name}
                  className="step"
                  role="tab"
                  id={`step-${index}`}
                  type="button"
                  aria-selected={step === index}
                  aria-controls="walk-panel"
                  tabIndex={step === index ? 0 : -1}
                  onClick={() => show(index)}
                  onKeyDown={onTabKey}
                >
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  {name}
                </button>
              ))}
            </div>
            <div id="walk-panel" role="tabpanel" aria-labelledby={`step-${step}`} className="walk" tabIndex={0}>
              <div className="walkcopy">
                <div className="stepnum" id="stepnum">
                  {String(step + 1).padStart(2, "0")}
                </div>
                <h3 id="walktitle">{stage.title}</h3>
                <p id="walkdesc">{stage.desc}</p>
                <button className="btn small" id="nextstep" type="button" onClick={() => show(step + 1)}>
                  {step === 6 ? "Restart the walkthrough" : `Next: ${STEP_NAMES[step + 1]}`}
                </button>
              </div>
              <div>
                <div className="walkvisual" id="walkvisual">
                  <WalkVisual step={step} onApprove={() => show(4)} />
                </div>
                <div className="samplelabel">Interactive workflow example · illustrative data</div>
              </div>
            </div>
          </div>
        </section>
        <section className="wrap" id="control">
          <div className="sectionhead">
            <div>
              <div className="eyebrow">02 / BUILT AROUND YOUR APPROVAL</div>
              <h2>
                YOUR SITE.
                <br />
                <span className="green">YOUR SAY.</span>
              </h2>
            </div>
            <p>Review the evidence. Adjust the wording. Approve the exact change. Keep a record of the work your team completes.</p>
          </div>
          <div className="featuregrid">
            <article className="feature">
              <div className="icon" aria-hidden="true">
                ≡
              </div>
              <h3>See the reason behind the rewrite.</h3>
              <p>Keep the page, search queries and business facts beside the recommendation. Spend your review time making a decision, with the context already there.</p>
            </article>
            <article className="feature">
              <div className="icon" aria-hidden="true">
                ✓
              </div>
              <h3>Approve exactly what gets published.</h3>
              <p>Compare the current and suggested title and description. Edit the draft before approving it for a supported WordPress site.</p>
            </article>
            <article className="feature wide">
              <div>
                <div className="icon" aria-hidden="true">
                  ↶
                </div>
                <h3>A record you can come back to.</h3>
                <p>See who approved a change and whether it was verified. Restore saved values where supported, with checks for edits made since publication.</p>
              </div>
              <div className="history">
                <div className="eyebrow">CHANGE HISTORY / SAMPLE</div>
                <div className="historyrow">
                  <span className="tick">✓</span>
                  <div>
                    <strong>Title and description published</strong>
                    <small>/services/drain-cleaning</small>
                  </div>
                  <time>10:42</time>
                </div>
                <div className="historyrow">
                  <span className="tick">✓</span>
                  <div>
                    <strong>Live page values verified</strong>
                    <small>Matched the approved version</small>
                  </div>
                  <time>10:43</time>
                </div>
                <div className="historyrow">
                  <span className="tick">↶</span>
                  <div>
                    <strong>Previous values saved</strong>
                    <small>Undo available if the page is unchanged</small>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
        <section className="agency">
          <div className="wrap">
            <div>
              <div className="eyebrow">03 / FOR PEOPLE MANAGING CLIENT SITES</div>
              <h2>
                KEEP EVERY
                <br />
                CLIENT MOVING.
              </h2>
              <p>Searchify is designed for small agencies and hands-on website owners who want a repeatable way to complete SEO work.</p>
            </div>
            <div className="agencylist">
              <div>
                <b>01</b>
                <strong>Keep each client’s business context in place.</strong>
              </div>
              <div>
                <b>02</b>
                <strong>Review the work that needs your attention.</strong>
              </div>
              <div>
                <b>03</b>
                <strong>Show clients what changed and what followed.</strong>
              </div>
            </div>
          </div>
        </section>
        <section className="wrap faq" id="questions">
          <div>
            <div className="eyebrow">A FEW THINGS TO KNOW</div>
            <h2>GOOD QUESTIONS.</h2>
            <p>The workspace is fully developed. You review every change before it goes live.</p>
          </div>
          <div>
            <details open>
              <summary>What does Searchify focus on first?</summary>
              <p>Searchify connects WordPress and Google Search Console, finds metadata opportunities, prepares titles and descriptions, and supports approval, publishing, verification, and monitoring.</p>
            </details>
            <details>
              <summary>Will it change my website automatically?</summary>
              <p>No. Every live change needs your approval. You review and can edit the proposed title and description before it is published.</p>
            </details>
            <details>
              <summary>Does “verified” mean Google has updated the result?</summary>
              <p>No. Verification checks that the live website reflects the approved values. Google controls when it recrawls the page and may choose different wording for search results.</p>
            </details>
            <details>
              <summary>Which websites will it support?</summary>
              <p>WordPress is supported now, with a defined set of SEO-plugin configurations. You can set up each site included in your plan.</p>
            </details>
            <details>
              <summary>Can I try it today?</summary>
              <p>Yes. Create access, answer the setup questions, choose a plan, and open your workspace. Connect WordPress and Search Console when you are ready to review live recommendations.</p>
            </details>
            <details>
              <summary>Does it guarantee better rankings?</summary>
              <p>No. Searchify is designed to help you complete and document SEO improvements. Search performance depends on many factors, and any changes need time and context to assess.</p>
            </details>
          </div>
        </section>
        <div className="closing">
          <div className="eyebrow">MEET YOUR NEXT SEO WORKFLOW</div>
          <div className="closing-title">
            GIVE GOOD SEO
            <br />
            <span className="green">A WAY TO GET DONE.</span>
          </div>
          <p>
            Explore the workspace. Review a recommendation.
            <br />
            See how the whole process fits together.
          </p>
          <Link className="btn primary" href="/signup">
            Explore Searchify
          </Link>
          <div className="micro">Interactive demo · No live changes</div>
        </div>
      </main>
    </LandingShell>
  );
}
