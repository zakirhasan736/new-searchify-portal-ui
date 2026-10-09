"use client";

import { useState } from "react";
import LandingShell from "@/components/landing/LandingShell";

const MAIL = "start@sovereignstandard.ca";

export default function ContactView() {
  const [fallback, setFallback] = useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const subject = `Searchify enquiry from ${fields.get("name")}`;
    const message = [
      `Name: ${fields.get("name")}`,
      `Email: ${fields.get("email")}`,
      `Website: ${fields.get("website") || "Not provided"}`,
      "",
      fields.get("message"),
    ].join("\n");
    setFallback(true);
    window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  return (
    <LandingShell current="contact">
      <main className="wrap contactlayout">
        <section className="contactintro">
          <div className="eyebrow">
            <span className="bar" /> CONTACT SEARCHIFY
          </div>
          <h1>
            LET&apos;S TALK
            <br />
            <em>REAL WORKFLOWS.</em>
          </h1>
          <p>
            Interested in the pilot, or want to share how your team handles SEO work today? Send a note and include the
            sites or workflow you&apos;d like to discuss.
          </p>
          <div className="contactdirect">
            <span className="eyebrow">EMAIL</span>
            <a href={`mailto:${MAIL}`}>{MAIL}</a>
          </div>
          <div className="conceptnote">
            Searchify is in product validation. The form opens your email app; it does not submit information to a
            website server.
          </div>
        </section>
        <form className="contactform" id="contact-form" onSubmit={onSubmit}>
          <label htmlFor="name">
            Your name <span aria-hidden="true">*</span>
          </label>
          <input id="name" name="name" autoComplete="name" required />
          <label htmlFor="email">
            Work email <span aria-hidden="true">*</span>
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="website">Website (optional)</label>
          <input id="website" name="website" type="url" placeholder="https://example.com" autoComplete="url" />
          <label htmlFor="message">
            What would you like to discuss? <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            placeholder="Tell us about your sites, workflow, or pilot questions."
          />
          <button className="btn primary" type="submit">
            Open email to send
          </button>
          <p className="formnote">Your message will be prepared in your email app, where you can review it before sending.</p>
          <p className="formfallback" id="form-fallback" hidden={!fallback}>
            If your email app did not open, email <a href={`mailto:${MAIL}`}>{MAIL}</a> directly.
          </p>
        </form>
      </main>
    </LandingShell>
  );
}
