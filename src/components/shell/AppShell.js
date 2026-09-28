"use client";

import { useState } from "react";
import Header from "../header/Header";
import Nav from "../navigation";

export default function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="main-wrapper-box">
      {menuOpen ? (
        <button className="nav-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
      ) : null}
      <div className="app-body">
        <Header menuOpen={menuOpen} onMenu={() => setMenuOpen((open) => !open)} />
        <div className="app-body-navigation">
          <Nav open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        </div>
        <div className="app-body-main-content">{children}</div>
      </div>
    </main>
  );
}
