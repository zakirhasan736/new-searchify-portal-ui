"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { userIsAuthenticated } from "@/utils/users/Helpers";
import { PLANS, beginAnotherWebsite, choosePlan, loadJourney, readySites } from "@/lib/journey";

export default function PlanStep() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const params = useSearchParams();
  const upgrade = params.get("upgrade") === "1";
  const [billing, setBilling] = useState("monthly");
  const [blocked, setBlocked] = useState("");
  const [current, setCurrent] = useState(null);
  const [used, setUsed] = useState(0);

  useEffect(() => {
    if (!userIsAuthenticated()) {
      router.replace("/login");
      return;
    }
    const state = loadJourney();
    if (!readySites(state).length) {
      router.replace("/app/start");
      return;
    }
    setCurrent(state.planId);
    setBilling(state.billing || "monthly");
    setUsed(readySites(state).length);
  }, [router]);

  const select = (plan) => {
    const used = readySites().length;
    if (used > plan.sites) {
      setBlocked(`${plan.name} includes ${plan.sites} website${plan.sites === 1 ? "" : "s"}. This workspace already has ${used}.`);
      return;
    }
    const next = choosePlan(plan.id, billing);
    if (!next) {
      setBlocked("That plan cannot cover the websites already set up.");
      return;
    }
    if (upgrade) {
      const path = beginAnotherWebsite();
      if (path.startsWith("/app/start")) {
        router.push(path);
        return;
      }
      setBlocked("That plan still has no room for another website.");
      return;
    }
    router.push(next);
  };

  return (
    <div className="sf-guide">
      <main className="shell">
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Searchify home">
            <span className="mark">s</span>
            <span>searchify</span>
          </Link>
          <div className="topmeta">
            <span>{used} website{used === 1 ? "" : "s"} ready</span>
          </div>
        </header>
        <section className="onboard">
          <div className="eyebrow">PLANS + USAGE</div>
          <h1 className="question-title">Choose your room to grow.</h1>
          <p className="question-desc">
            Your answers decide which work Searchify prepares. The plan decides how many websites, keywords, prompts, and audits are included. Confirm a plan to open the dashboard.
          </p>
          {upgrade ? (
            <div className="upgrade-note">This plan has no room for another website. Choose a plan with a higher website allowance, then add the site.</div>
          ) : null}
          {blocked ? <div className="upgrade-note">{blocked}</div> : null}
          <div className="interval" role="group" aria-label="Billing interval">
            <button type="button" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>Monthly</button>
            <button type="button" aria-pressed={billing === "annual"} onClick={() => setBilling("annual")}>Annual</button>
            <span className="fieldnote">Annual prices shown per month, billed yearly.</span>
          </div>
          <div className="plan-grid">
            {PLANS.map((plan, index) => {
              const amount = billing === "annual" ? plan.annual : plan.price;
              return (
                <motion.article
                  key={plan.id}
                  className={`plan-card${current === plan.id ? " selected" : ""}`}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: reduce ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="eyebrow">{current === plan.id ? "CURRENT" : "SUBSCRIPTION"}</div>
                  <h2>{plan.name}</h2>
                  <p>{plan.desc}</p>
                  <div className="plan-price">
                    ${amount}
                    <small>USD / mo</small>
                  </div>
                  <ul className="plan-features">
                    <li>{plan.sites === 1 ? "1 website" : `${plan.sites} websites`}</li>
                    <li>{plan.keywords} tracked keywords</li>
                    <li>{plan.prompts} AI visibility prompts</li>
                    <li>{plan.audits} site audits</li>
                    <li>Human approval before every live change</li>
                  </ul>
                  <button className="continuebtn" type="button" onClick={() => select(plan)}>
                    {current === plan.id ? "Continue with this plan" : `Choose ${plan.name}`}
                  </button>
                </motion.article>
              );
            })}
          </div>
          <p className="fieldnote" style={{ marginTop: 18 }}>
            Confirming a plan saves it for this workspace and opens your results. Card checkout is recorded as this selection until billing is connected.
          </p>
        </section>
      </main>
    </div>
  );
}
