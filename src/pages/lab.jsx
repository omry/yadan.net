import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './lab.module.css';

export default function Lab() {
  const airportLabUrl = useBaseUrl('/lab/airport-time-space/');
  return (
    <Layout title="Lab" description="Interactive experiments from Omry Yadan.">
      <main className={styles.main}>
        <h1>Lab</h1>
        <article className={styles.experiment}>
          <h2>Airport Time / Space</h2>
          <p>
            Reconstruct a 3D shape using only flight times between airports.
            Compare real nonstop schedules with synthetic sphere and flat-plane
            experiments, or import your own CSV.
          </p>
          <a className="button button--primary" href={airportLabUrl}>
            Open experiment
          </a>
        </article>
      </main>
    </Layout>
  );
}
