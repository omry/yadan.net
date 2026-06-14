import React, {useEffect, useRef} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function GiscusComments() {
  const containerRef = useRef(null);
  const {
    siteConfig: {customFields},
  } = useDocusaurusContext();
  const giscus = customFields.giscus;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !giscus?.repo || !giscus?.repoId || !giscus?.categoryId) {
      return undefined;
    }

    container.replaceChildren();

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', giscus.repo);
    script.setAttribute('data-repo-id', giscus.repoId);
    script.setAttribute('data-category', giscus.category);
    script.setAttribute('data-category-id', giscus.categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'transparent_dark');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');

    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [giscus]);

  if (!giscus?.repo || !giscus?.repoId || !giscus?.categoryId) {
    return null;
  }

  return (
    <section className="blogComments" aria-label="Comments">
      <h2>Comments</h2>
      <div ref={containerRef} className="blogCommentsFrame" />
    </section>
  );
}
