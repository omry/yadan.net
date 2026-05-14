import React from 'react';
import styles from './ProjectMark.module.css';

function getInitials(title) {
  const words = title.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])/g) ?? title.split(/\s+/);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function ProjectMark({project}) {
  if (project.logo?.src) {
    return (
      <span className={styles.projectMark} title={`${project.title} logo`} aria-hidden="true">
        <img src={project.logo.src} alt="" />
      </span>
    );
  }

  return (
    <span
      className={`${styles.projectMark} ${styles.placeholder}`}
      title={`${project.title} placeholder mark`}
      aria-hidden="true">
      {project.logo?.initials ?? getInitials(project.title)}
    </span>
  );
}
