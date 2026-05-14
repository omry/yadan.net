import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import blogPostList from '~blog/default/blog-post-list-prop-default.json';
import ProjectBubble from '../components/ProjectBubble';
import ProjectMark from '../components/ProjectMark';
import {
  homeFeaturedProjects,
  homeProjectListProjects,
  projectAnchor,
} from '../data/siteContent';
import styles from './index.module.css';

const HOME_NOTE_LIMIT = 3;

function HomeProjectList({projects}) {
  return (
    <ul className={styles.homeProjectList}>
      {projects.map((project) => (
        <li key={project.title}>
          <Link
            className={styles.homeProjectBody}
            to={`/projects/#${projectAnchor(project)}`}>
            <div className={styles.homeProjectCopy}>
              <span className={styles.projectTitleLine}>
                <ProjectMark project={project} />
                <span className={styles.projectTitleText}>{project.title}</span>
              </span>
              <p>{project.tagline}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function formatNoteDate(date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(date));
}

function RecentNotes() {
  const notes = blogPostList.items
    .filter((post) => !post.unlisted)
    .slice(0, HOME_NOTE_LIMIT);

  return (
    <ul className={styles.homeNoteList}>
      {notes.map((post) => (
        <li key={post.permalink}>
          <Link to={post.permalink}>{post.title}</Link>
          <time dateTime={post.date}>{formatNoteDate(post.date)}</time>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <Layout
      noFooter
      title="Omry Yadan"
      description="Personal website for Omry Yadan: projects, notes, and selected personal context.">
      <main className={styles.homeMain}>
        <section className={styles.homeFrame} aria-labelledby="home-title">
          <div className={styles.homeGrid} aria-label="Site surfaces">
            <div className={styles.homeLeftColumn}>
              <header className={styles.homeTitleBlock}>
                <h1 id="home-title">
                  <span className={styles.logoO}>O</span>mry{' '}
                  <span className={styles.logoY}>Y</span>adan
                </h1>
                <p className={styles.homeLede}>May your sockets never timeout.</p>
              </header>

              <article className={`${styles.homeCard} ${styles.homeNotesCard}`}>
                <div>
                  <Link className={`${styles.eyebrow} ${styles.surfaceLink}`} to="/blog">
                    Notes
                  </Link>
                  <RecentNotes />
                </div>
              </article>
            </div>

            <article className={`${styles.homeCard} ${styles.homeProjectsCard}`}>
              <Link className={`${styles.eyebrow} ${styles.surfaceLink}`} to="/projects">
                Projects
              </Link>

              <div className={styles.homeFeaturedList} aria-label="Highlighted project">
                {homeFeaturedProjects.map((project) => (
                  <ProjectBubble key={project.title} project={project} />
                ))}
              </div>

              <HomeProjectList projects={homeProjectListProjects} />
            </article>
          </div>
        </section>
      </main>
    </Layout>
  );
}
