import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

function ContactForm({formId}) {
  const formReady = Boolean(formId);
  const formEndpoint = formReady ? `https://formspree.io/f/${formId}` : undefined;

  return (
    <div className={styles.contactCard}>
      <form
        acceptCharset="UTF-8"
        action={formEndpoint}
        className={styles.contactForm}
        method="POST">
        <input type="hidden" name="subject" value="New message from yadan.net" />
        <div className={styles.trap} aria-hidden="true">
          <label htmlFor="contact-extra">Leave this field empty</label>
          <input
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            id="contact-extra"
            inputMode="none"
            name="_gotcha"
            tabIndex={-1}
            type="text"
          />
        </div>

        <label className={styles.fieldGroup}>
          <span>Name</span>
          <input autoComplete="name" name="name" required type="text" />
        </label>

        <label className={styles.fieldGroup}>
          <span>Email</span>
          <input autoComplete="email" name="email" required type="email" />
        </label>

        <label className={styles.fieldGroup}>
          <span>Message</span>
          <textarea name="message" required rows="6" />
        </label>

        <button
          className={`${styles.button} ${styles.primary}`}
          disabled={!formReady}
          type="submit">
          Send message
        </button>

        {!formReady ? (
          <p className={`${styles.formStatus} ${styles.error}`} role="status">
            Contact form setup is pending.
          </p>
        ) : null}
      </form>
    </div>
  );
}

export default function Contact() {
  const {siteConfig} = useDocusaurusContext();
  const formspreeFormId = siteConfig.customFields.formspreeFormId;

  return (
    <Layout
      title="Contact"
      description="Contact form for Omry Yadan.">
      <main className={styles.contactMain}>
        <section className={styles.contactStandalone}>
          <header className={styles.contactIntro}>
            <p className={styles.eyebrow}>Contact</p>
            <h1>Get in touch.</h1>
            <p>Send a note and I will get back to you when I can.</p>
          </header>
          <ContactForm formId={formspreeFormId} />
        </section>
      </main>
    </Layout>
  );
}
