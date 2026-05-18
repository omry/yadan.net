import React from 'react';
import Layout from '@theme/Layout';
import ProjectBubble from '../components/ProjectBubble';
import ProjectMark from '../components/ProjectMark';
import {featuredProjects, projectAnchor} from '../data/siteContent';
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
  return (
    <Layout
      title="Projects"
      description="Selected public projects from Omry Yadan.">
      <main>
        <header className={styles.projectIntroBubble}>
          <h1>Projects</h1>
          <ProjectShortcuts projects={featuredProjects} />
        </header>

        <section className={`${styles.section} ${styles.projectSection} ${styles.projectListSection}`}>
          <div className={styles.projectBubbleGrid}>
            {featuredProjects.map((project, index) => (
              <ProjectBubble featured={index === 0} key={project.title} project={project} />
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
