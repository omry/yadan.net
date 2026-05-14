import React from 'react';
import Link from '@docusaurus/Link';
import ProjectLinks from './ProjectLinks';
import ProjectMark from './ProjectMark';
import {projectAnchor} from '../data/siteContent';
import styles from '../pages/index.module.css';

const screenshotLayoutClasses = {
  grid: styles.gridScreenshots,
  horizontal: styles.horizontalScreenshots,
  single: styles.singleScreenshot,
  vertical: styles.verticalScreenshots,
};

function getScreenshotLayout(project, screenshotCount) {
  if (project.screenshotLayout && screenshotLayoutClasses[project.screenshotLayout]) {
    return project.screenshotLayout;
  }
  if (screenshotCount >= 4) {
    return 'grid';
  }
  if (screenshotCount === 2) {
    return 'vertical';
  }
  return 'single';
}

function getScreenshotTitle(screenshot) {
  const previewSize = screenshot.previewSize ? `Preview: ${screenshot.previewSize}` : null;
  const fullSize = screenshot.fullSize ? `Full image: ${screenshot.fullSize}` : null;
  return [screenshot.alt, previewSize, fullSize, 'Open full-size image']
    .filter(Boolean)
    .join(' - ');
}

function GitHubStatIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.projectStatIcon}
      focusable="false"
      viewBox="0 0 24 24">
      <path
        clipRule="evenodd"
        d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.6 3 8.5 7.1 9.9.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.3-2.3-.3-4.8-1.2-4.8-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.3.1-2.8 0 0 .9-.3 2.9 1.1.8-.2 1.7-.3 2.6-.3.9 0 1.8.1 2.6.3 2-1.4 2.9-1.1 2.9-1.1.6 1.5.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.8 0 4.1-2.5 5-4.8 5.2.4.3.8 1 .8 2v3c0 .3.2.6.8.5 4.1-1.4 7.1-5.3 7.1-9.9C22.5 6.2 17.8 1.5 12 1.5Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function StatIcon({type}) {
  if (type === 'github-stars') {
    return <GitHubStatIcon />;
  }
  return null;
}

function ProjectStatValue({stat}) {
  if (stat.badge) {
    return (
      <a
        className={styles.projectStatBadgeLink}
        href={stat.badge.href}
        rel="noopener noreferrer"
        target="_blank"
        title={`${stat.label}: ${stat.value}`}>
        <img
          alt={`${stat.label}: ${stat.value}`}
          className={styles.projectStatBadge}
          loading="lazy"
          src={stat.badge.src}
        />
      </a>
    );
  }

  return stat.value;
}

function ProjectMedia({project, screenshots, screenshotClassName}) {
  if (project.embed) {
    return (
      <div className={`${styles.projectScreenshots} ${styles.singleScreenshot}`}>
        <iframe
          allow="accelerometer; gyroscope; fullscreen; xr-spatial-tracking"
          allowFullScreen
          className={styles.projectEmbed}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={project.embed.src}
          title={project.embed.title}
        />
      </div>
    );
  }

  if (!screenshots.length) {
    return null;
  }

  return (
    <div className={screenshotClassName}>
      {screenshots.map((screenshot) => (
        <div className={styles.projectScreenshot} key={screenshot.src}>
          <a
            className={styles.projectScreenshotLink}
            href={screenshot.fullSrc ?? screenshot.src}
            rel="noopener noreferrer"
            target="_blank"
            title={getScreenshotTitle(screenshot)}>
            <img alt={screenshot.alt} src={screenshot.src} />
          </a>
        </div>
      ))}
    </div>
  );
}

export default function ProjectBubble({className, featured = false, project}) {
  const classNames = [styles.projectBubble];
  const screenshots = project.screenshots?.slice(0, 4) ?? [];
  const screenshotLayout = getScreenshotLayout(project, screenshots.length);
  const screenshotClassName = `${styles.projectScreenshots} ${screenshotLayoutClasses[screenshotLayout]}`;
  const hasStats = Boolean(project.stats?.length);

  if (featured) {
    classNames.push(styles.featured);
  }
  if (!hasStats) {
    classNames.push(styles.noStats);
  }
  if (className) {
    classNames.push(className);
  }

  return (
    <article className={classNames.join(' ')} id={projectAnchor(project)}>
      <div className={styles.projectBubbleHeader}>
        <h3 className={styles.projectTitleLine}>
          <ProjectMark project={project} />
          <Link className={styles.projectTitleText} to={`/projects/#${projectAnchor(project)}`}>
            {project.title}
          </Link>
        </h3>
        <div className={styles.projectBubbleActions}>
          <ProjectLinks
            layout="row"
            links={project.links}
            projectTitle={project.title}
            showLabels
          />
        </div>
      </div>
      <ProjectMedia
        project={project}
        screenshotClassName={screenshotClassName}
        screenshots={screenshots}
      />
      <p className={styles.projectDescription}>{project.description ?? project.tagline}</p>
      {hasStats ? (
        <dl className={styles.projectStats}>
          {project.stats.map((stat) => (
            <div key={stat.label}>
              <dt className={styles.projectStatLabel}>
                <StatIcon type={stat.badge ? undefined : stat.type} />
                <span>{stat.label}</span>
              </dt>
              <dd>
                <ProjectStatValue stat={stat} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}
