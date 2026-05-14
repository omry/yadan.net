import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {aboutSummary} from '../data/siteContent';
import styles from './index.module.css';

export default function About() {
  return (
    <Layout
      title="About"
      description="Short background, interests, and public context for Omry Yadan.">
      <main className={styles.aboutMain}>
        <section className={styles.aboutShell}>
          <article className={styles.aboutCard}>
            <p className={styles.eyebrow}>About</p>
            <h1>
              <span className={styles.logoO}>O</span>mry{' '}
              <span className={styles.logoY}>Y</span>adan
            </h1>
            <div className={styles.aboutBody}>
              <p>{aboutSummary}</p>
            </div>
          </article>

          <aside className={styles.aboutAside} aria-label="Current focus">
            <p className={styles.eyebrow}>Now</p>
            <p>
              Maintaining Hydra and OmegaConf, building Rakia, and writing when
              a stable URL is useful.
            </p>
            <p>
              I use this site as a quiet home for project context and occasional
              notes.
            </p>
            <div className={styles.aboutLinks} aria-label="About page links">
              <Link className={styles.aboutLink} to="/projects">
                Projects
              </Link>
              <Link className={styles.aboutLink} to="/blog">
                Notes
              </Link>
              <Link className={styles.aboutLink} to="/contact">
                Contact
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </Layout>
  );
}
