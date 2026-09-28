"use client";
import React, { useMemo, useState } from "react";
import { NavLink, Link } from "@/lib/navigation";
import Brandlogo from "../../assets/img/brand-logo.svg";
import styles from "./style.module.css";
import { BookIcon, FolderIcon, SettingIcon } from "./Icons";
import { FEATURES } from "@/lib/featureCatalog";

const RESEARCH = [
  { path: "/SEOranking", title: "Keywords" },
  { path: "/keywordanalyze/home", title: "Keyword Analyze" },
  { path: "/websitekeyword/home", title: "Website Keywords" },
  { path: "/keywordgeneretor/home", title: "Generate Keywords" },
  { path: "/trafficsAnalytics/overview", title: "Traffic Analytics" },
  { path: "/keywordgap/home", title: "Keyword Gap" },
  { path: "/keywordmannager/home", title: "Keyword Manager" },
  { path: "/organicsearch/home", title: "Organic Search" },
  { path: "/keywordoverview/home", title: "Keyword Overview" },
  { path: "/domainoverview/home", title: "Domain Overview" },
  { path: "/backlink/home", title: "Backlink Analytics" },
];

const START = [
  { path: "/works", title: "My works", icon: FolderIcon },
  { path: "/dashboard", title: "Dashboard", icon: BookIcon },
  { path: "/seooptimization", title: "Site optimization", icon: SettingIcon },
];

const Nav = ({ open = false, onNavigate }) => {
  const [query, setQuery] = useState("");
  const [openSection, setOpenSection] = useState("research");
  const needle = query.trim().toLowerCase();

  const workspace = useMemo(() => {
    return FEATURES.reduce((groups, feature) => {
      const current = groups.find((group) => group.name === feature.group);
      if (current) current.items.push(feature);
      else groups.push({ name: feature.group, items: [feature] });
      return groups;
    }, []);
  }, []);

  const research = RESEARCH.filter((item) => item.title.toLowerCase().includes(needle));
  const start = START.filter((item) => item.title.toLowerCase().includes(needle));
  const groups = workspace
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.title.toLowerCase().includes(needle) ||
          group.name.toLowerCase().includes(needle)
      ),
    }))
    .filter((group) => group.items.length);

  const searching = needle.length > 0;

  const toggle = (name) => {
    setOpenSection((current) => (current === name ? "" : name));
  };

  return (
    <div className={`${styles.sidebar_section} ${open ? styles.sidebar_open : ""}`}>
      <div className={styles.sidebar_logo}>
        <Link to="/works" onClick={onNavigate}>
          <img src={Brandlogo} className={styles.brand_logo_desk} alt="Searchify" />
        </Link>
        <p className={styles.logo_note}>SEO workspace</p>
      </div>
      <label className={styles.find}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20L16.5 16.5" />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a tool"
          aria-label="Find a tool"
        />
      </label>
      <nav
        className={styles.navbar_nav}
        onClick={(event) => {
          if (event.target.closest("a")) onNavigate?.();
        }}
      >
        {(searching ? start.length > 0 : true) && (
          <section>
            <p className={styles.section_label}>Start</p>
            <ul>
              {(searching ? start : START).map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink to={item.path}>
                      <Icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {research.length > 0 && (
          <section>
            <button type="button" className={styles.section_button} onClick={() => toggle("research")}>
              Research
              <span>{searching || openSection === "research" ? "–" : "+"}</span>
            </button>
            {(searching || openSection === "research") && (
              <ul>
                {research.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {groups.length > 0 && (
          <section>
            <button type="button" className={styles.section_button} onClick={() => toggle("workspace")}>
              Workspace
              <span>{searching || openSection === "workspace" ? "–" : "+"}</span>
            </button>
            {(searching || openSection === "workspace") &&
              groups.map((group) => (
                <div key={group.name} className={styles.group_block}>
                  <p className={styles.group_label}>{group.name}</p>
                  <ul>
                    {group.items.map((feature) => (
                      <li key={feature.path}>
                        <Link to={feature.path}>{feature.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </section>
        )}

        {searching && !start.length && !research.length && !groups.length && (
          <p className={styles.empty}>No tools match that search.</p>
        )}
      </nav>
    </div>
  );
};

export default Nav;
