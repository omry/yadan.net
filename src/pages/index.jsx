import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import blogPostList from '~blog/default/blog-post-list-prop-default.json';
import ProjectLinks from '../components/ProjectLinks';
import ProjectMark from '../components/ProjectMark';
import {featuredProjects, projectAnchor} from '../data/siteContent';
import styles from './index.module.css';

const HOME_NOTE_LIMIT = 3;

function HomeProjectList() {
  return (
    <ul className={styles.homeProjectList}>
      {featuredProjects.map((project) => (
        <li key={project.title}>
          <div className={styles.homeProjectBody}>
            <div className={styles.homeProjectCopy}>
              <span className={styles.projectTitleLine}>
                <ProjectMark project={project} />
                <Link
                  className={styles.projectTitleText}
                  to={`/projects/#${projectAnchor(project)}`}>
                  {project.title}
                </Link>
              </span>
              <p>{project.tagline}</p>
            </div>
            <ProjectLinks links={project.links} projectTitle={project.title} />
          </div>
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
          <header className={styles.homeIntro}>
            <div className={styles.homeTitleBlock}>
              <h1 id="home-title">
                <span className={styles.logoO}>O</span>mry{' '}
                <span className={styles.logoY}>Y</span>adan
              </h1>
              <p className={styles.homeLede}>May your sockets never timeout.</p>
            </div>
            <div className={styles.homeAboutBrief}>
              <p>
                Retired software engineer, formerly at Facebook, Face.com, and
                Telmap.com. Today I keep Hydra and OmegaConf running and make
                room for new ideas.
              </p>
              <Link className={styles.textLink} to="/about">
                About...
              </Link>
            </div>
          </header>

          <div className={styles.homeDeck} aria-label="Site surfaces">
            <article className={styles.homeCard}>
              <div>
                <Link className={`${styles.eyebrow} ${styles.surfaceLink}`} to="/blog">
                  Notes
                </Link>
                <RecentNotes />
              </div>
            </article>

            <article className={styles.homeCard}>
              <div>
                <Link className={`${styles.eyebrow} ${styles.surfaceLink}`} to="/projects">
                  Projects
                </Link>
                <HomeProjectList />
              </div>
            </article>
          </div>
        </section>
      </main>
    </Layout>
  );
}
