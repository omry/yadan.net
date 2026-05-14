import React from 'react';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

function ContactForm({formId, recaptchaSiteKey}) {
  const formReady = Boolean(formId);
  const formEndpoint = formReady ? `https://formspree.io/f/${formId}` : undefined;
  const recaptchaEnabled = Boolean(recaptchaSiteKey);
  const formRef = React.useRef(null);
  const [submitState, setSubmitState] = React.useState('idle');

  const handleSubmit = React.useCallback(
    async (event) => {
      event.preventDefault();

      const form = formRef.current;
      if (!form?.reportValidity()) {
        return;
      }

      setSubmitState('submitting');

      try {
        const formData = new FormData(form);

        if (recaptchaEnabled) {
          const grecaptcha =
            typeof window !== 'undefined' ? window.grecaptcha : undefined;

          if (!grecaptcha?.ready || !grecaptcha?.execute) {
            throw new Error('reCAPTCHA is not ready');
          }

          const token = await new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
              grecaptcha
                .execute(recaptchaSiteKey, {action: 'submit'})
                .then(resolve)
                .catch(reject);
            });
          });

          formData.set('g-recaptcha-response', token);
        }

        const response = await fetch(form.action, {
          body: formData,
          headers: {
            Accept: 'application/json',
          },
          method: form.method,
        });

        if (!response.ok) {
          throw new Error('Formspree rejected the submission');
        }

        form.reset();
        setSubmitState('success');
      } catch {
        setSubmitState('error');
      }
    },
    [recaptchaEnabled, recaptchaSiteKey],
  );

  return (
    <div className={styles.contactCard}>
      {recaptchaEnabled ? (
        <Head>
          <script
            async
            defer
            src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
          />
        </Head>
      ) : null}
      <form
        acceptCharset="UTF-8"
        action={formEndpoint}
        className={styles.contactForm}
        method="POST"
        onSubmit={handleSubmit}
        ref={formRef}>
        <input type="hidden" name="subject" value="New message from yadan.net" />
        {recaptchaEnabled ? <input type="hidden" name="g-recaptcha-response" /> : null}
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

        {recaptchaEnabled ? (
          <p className={styles.recaptchaNotice}>
            This site is protected by reCAPTCHA.
          </p>
        ) : null}

        <button
          className={`${styles.button} ${styles.primary}`}
          disabled={!formReady || submitState === 'submitting'}
          type="submit">
          {submitState === 'submitting' ? 'Sending...' : 'Send message'}
        </button>

        {!formReady ? (
          <p className={`${styles.formStatus} ${styles.error}`} role="status">
            Contact form setup is pending.
          </p>
        ) : null}

        {submitState === 'success' ? (
          <p className={`${styles.formStatus} ${styles.success}`} role="status">
            Message sent. Thank you.
          </p>
        ) : null}

        {submitState === 'error' ? (
          <p className={`${styles.formStatus} ${styles.error}`} role="status">
            Could not send this message. Please try again.
          </p>
        ) : null}
      </form>
    </div>
  );
}

export default function Contact() {
  const {siteConfig} = useDocusaurusContext();
  const formspreeFormId = siteConfig.customFields.formspreeFormId;
  const recaptchaSiteKey = siteConfig.customFields.recaptchaSiteKey;

  return (
    <Layout
      title="Contact"
      description="Contact form for Omry Yadan.">
      <main className={styles.contactMain}>
        <section className={styles.contactStandalone}>
          <header className={styles.contactIntro}>
            <p className={styles.eyebrow}>Contact</p>
            <h1>Get in touch.</h1>
            <p>Send a message and I will get back to you when I can.</p>
          </header>
          <ContactForm
            formId={formspreeFormId}
            recaptchaSiteKey={recaptchaSiteKey}
          />
        </section>
      </main>
    </Layout>
  );
}
