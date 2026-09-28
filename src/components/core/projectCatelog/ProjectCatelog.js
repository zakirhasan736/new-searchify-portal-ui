"use client";
import React from "react";
import { Link, useNavigate } from "@/lib/navigation";
import styles from "./projectcatelog.module.css";
import Card from "../../share/card/card";
import { getProject } from "../../../utils/users/ProjectUtil";

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ProjectCatelog = ({ projectTitle, addNewProject, seeMoreBtn, AddProject, DrafteProject }) => {
  const navigate = useNavigate();
  const websites = getProject()?.websites || [];

  const handleCreateNew = () => {
    localStorage.removeItem("currentWebsite");
    navigate("/seooptimization/new");
  };

  return (
    <section className={styles.project_catelog_section}>
      <div className={styles.project_catelog_wrap}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Start</p>
            <h2 className={styles.project_title}>{projectTitle}</h2>
            <p className={styles.lead}>Add a site, then open it to crawl and optimize.</p>
          </div>
          {addNewProject && (
            <button type="button" className={styles.add_new__project} onClick={handleCreateNew}>
              <span className={styles.plus}>
                <PlusIcon />
              </span>
              New project
            </button>
          )}
        </header>

        <div className={styles.project__content_wrap}>
          {AddProject && websites.length === 0 && (
            <p className={styles.empty}>No sites yet. Create the first project to start a crawl.</p>
          )}
          {AddProject && websites.length > 0 && (
            <div className={styles.projects__item}>
              {websites.map((website) => (
                <Card
                  key={website.url || website.name}
                  cardTitle={website.name}
                  cardSubTitle="Site name"
                  cardDesc={website.name}
                  cardSubTitle2="Site URL"
                  cardDesc2={website.url}
                  website={website}
                />
              ))}
            </div>
          )}
          {DrafteProject && <div className={styles.projects__item} />}
          {seeMoreBtn && (
            <div className={styles.project__item_box_more}>
              <Link to="/" className={styles.seeAll__btn}>See all</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectCatelog;
