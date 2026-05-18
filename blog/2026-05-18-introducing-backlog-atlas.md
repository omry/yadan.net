---
slug: introducing-backlog-atlas
title: Introducing Backlog Atlas
authors: [omry]
tags: [engineering, projects, open-source]
description: A short introduction to Backlog Atlas, a self-hosted backlog dashboard for GitHub maintainers.
---

Backlog Atlas started from a maintainer problem I kept running into across
Hydra, OmegaConf, and related projects: the backlog was too large to hold in my
head, and GitHub made it hard to decide what to prioritize across repositories.

<!-- truncate -->

<p>
  <a href="/img/projects/backlog-atlas/dashboard.png">
    <img
      src="/img/projects/backlog-atlas/dashboard.png"
      alt="Backlog Atlas dashboard showing backlog summary tables, filters, issue rows, and recent activity"
      width="720"
    />
  </a>
</p>

For projects like Hydra and OmegaConf, the backlog is not just a private todo
list. It is part of the project surface. Contributors look at it to understand
what is happening, users look at it to guess whether something is alive, and I
look at it when deciding where attention should go next.

Backlog Atlas generates that view as static files. It collects repository issue
and pull request metadata, commits snapshots into the repositories that own
them, and publishes a small dashboard through GitHub Pages. There is no server
to run, no database to maintain, and no hosted product account in the middle.

That shape is deliberate. For open-source maintenance, boring deployment is a
feature: generated data should be visible, reviewable, and easy to remove if the
tool stops earning its keep.

The first public version already supports a browser-federated atlas view: each
repository publishes its own `backlog.json`, and one static dashboard can load
multiple downstream repositories and merge them locally in the browser.

The product is in the right shape now, including `backlog-atlas atlas install`
for batch installing or upgrading all tracked repositories. From here it will
evolve as I use it further and start to receive user feedback.

You can see this repository's dashboard at
[omry.github.io/backlog-atlas](https://omry.github.io/backlog-atlas/), and the
project itself is on
[GitHub](https://github.com/omry/backlog-atlas) and
[PyPI](https://pypi.org/project/backlog-atlas/).
