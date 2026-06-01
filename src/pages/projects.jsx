import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import ProjectBubble from '../components/ProjectBubble';
import ProjectMark from '../components/ProjectMark';
import {featuredProjects, projectAnchor, smallProjects} from '../data/siteContent';
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

function SmallProjects({projects}) {
  if (!projects.length) {
    return null;
  }

  return (
    <section className={`${styles.section} ${styles.smallProjectsSection}`}>
      <h2>Small projects</h2>
      <ul className={styles.smallProjectList}>
        {projects.map((project) => (
          <li key={project.title}>
            <div>
              <strong>{project.title}</strong>
              <p>{project.summary}</p>
            </div>
            <div className={styles.smallProjectLinks}>
              {project.links.map((link) => (
                <Link key={link.href} to={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
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

        <SmallProjects projects={smallProjects} />
      </main>
    </Layout>
  );
}
