import React from 'react';
import Layout from '@theme/Layout';
import ProjectBubble from '../components/ProjectBubble';
import ProjectMark from '../components/ProjectMark';
import {featuredProjects, projectAnchor, secondaryProjects} from '../data/siteContent';
import styles from './index.module.css';

function ProjectShortcuts({projects}) {
  return (
    <nav className={styles.projectShortcuts} aria-label="Project shortcuts">
      {projects.map((project) => (
        <a
          className={styles.projectShortcut}
          href={`#${projectAnchor(project)}`}
          key={project.title}>
          <ProjectMark project={project} />
          <span>{project.title}</span>
        </a>
      ))}
    </nav>
  );
}

export default function Projects() {
  const allProjects = [...featuredProjects, ...secondaryProjects];

  return (
    <Layout
      title="Projects"
      description="Selected public projects and archive work from Omry Yadan.">
      <main>
        <header className={styles.projectIntroBubble}>
          <h1>Projects</h1>
          <ProjectShortcuts projects={allProjects} />
        </header>

        <section className={`${styles.section} ${styles.projectSection} ${styles.projectListSection}`}>
          <div className={styles.projectBubbleGrid}>
            {featuredProjects.map((project, index) => (
              <ProjectBubble featured={index === 0} key={project.title} project={project} />
            ))}
          </div>
        </section>

        {secondaryProjects.length ? (
          <section className={styles.section}>
            <p className={styles.projectSectionLabel}>Archive</p>
            <div className={styles.projectBubbleGrid}>
              {secondaryProjects.map((project) => (
                <ProjectBubble key={project.title} project={project} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </Layout>
  );
}
