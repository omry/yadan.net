import React from 'react';
import styles from './ProjectLinks.module.css';

const linkTypeLabels = {
  docs: 'Documentation',
  github: 'GitHub',
  package: 'Package profile',
  paper: 'Paper',
  website: 'Website',
};

function formatTarget(href) {
  try {
    const url = new URL(href);
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${url.hostname}${path}`;
  } catch {
    return href;
  }
}

function GitHubIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.6 3 8.5 7.1 9.9.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.3-2.3-.3-4.8-1.2-4.8-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.3.1-2.8 0 0 .9-.3 2.9 1.1.8-.2 1.7-.3 2.6-.3.9 0 1.8.1 2.6.3 2-1.4 2.9-1.1 2.9-1.1.6 1.5.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.8 0 4.1-2.5 5-4.8 5.2.4.3.8 1 .8 2v3c0 .3.2.6.8.5 4.1-1.4 7.1-5.3 7.1-9.9C22.5 6.2 17.8 1.5 12 1.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.2 2.4 3.4 5.4 3.4 9s-1.2 6.6-3.4 9M12 3c-2.2 2.4-3.4 5.4-3.4 9s1.2 6.6 3.4 9" />
      </g>
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v16H7.5A2.5 2.5 0 0 0 5 20.5v-16Z" />
        <path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H20" />
        <path d="M9 6h6M9 10h6" />
      </g>
    </svg>
  );
}

function PaperIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M6 3h8l4 4v14H6V3Z" />
        <path d="M14 3v5h4M9 12h6M9 16h6" />
      </g>
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4 7.5 12 12l8-4.5M12 12v9" />
      </g>
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M7 17 17 7M9 7h8v8" />
      </g>
    </svg>
  );
}

function LinkIcon({type}) {
  if (type === 'github') {
    return <GitHubIcon />;
  }
  if (type === 'website') {
    return <WebsiteIcon />;
  }
  if (type === 'docs') {
    return <DocsIcon />;
  }
  if (type === 'paper') {
    return <PaperIcon />;
  }
  if (type === 'package') {
    return <PackageIcon />;
  }
  return <ExternalIcon />;
}

export default function ProjectLinks({layout = 'column', links, projectTitle, showLabels = false}) {
  const classNames = [styles.projectLinks];
  if (layout === 'row') {
    classNames.push(styles.rowLinks);
  }
  if (showLabels) {
    classNames.push(styles.labeledLinks);
  }

  return (
    <div className={classNames.join(' ')} aria-label={`${projectTitle} links`}>
      {links.map((link) => {
        const typeLabel = linkTypeLabels[link.type] ?? link.label;
        const target = formatTarget(link.href);
        const label = `${typeLabel} for ${projectTitle}: ${target}`;
        const visibleLabel = link.label ?? typeLabel;

        return (
          <a
            className={styles.projectLink}
            href={link.href}
            key={link.href}
            aria-label={label}
            rel="noopener noreferrer"
            target="_blank"
            title={`${typeLabel}: ${target}`}>
            <LinkIcon type={link.type} />
            {showLabels ? <span>{visibleLabel}</span> : null}
          </a>
        );
      })}
    </div>
  );
}
