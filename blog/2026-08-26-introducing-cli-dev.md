---
slug: introducing-cli-dev
title: Introducing the cli.dev Ecosystem
authors: [omry]
tags: [engineering, projects]
description: cli.dev is a shared home for the tools, products, and experiments I build and maintain.
---

Over the last few months, I have been working on several projects that share a
common thread but have lived across different repositories and domains. Today,
I am giving them a shared home: [cli.dev](https://cli.dev/).

The domain has a little history. cli.dev was the second-choice domain for
Hydra. Facebook obtained it before it managed to obtain hydra.cc; once it did,
Hydra moved and cli.dev spent the following years as a derelict redirect. I am
now giving it a new role.

The cli.dev ecosystem brings together tools, products, and experiments for
building, deploying, and operating software. It currently includes Hydra,
OmegaConf, Arbiter, Reploy, and OmegaFlow.

<!-- truncate -->

This is the launch of the ecosystem, not a simultaneous launch of all its
projects. Several are still under active development, and not all are ready for
general use yet.

This is an umbrella, not a monorepo or a new name imposed on every project.
Each project keeps its own identity, website, documentation, repository, and
release lifecycle. cli.dev provides a directory and a little shared context for
understanding how the projects relate.

Some of them are mature and widely used. [Hydra](https://hydra.cc/) and
[OmegaConf](https://omegaconf.readthedocs.io/) have been around for years.
Others are newer and still taking shape:

- [Arbiter](https://arbiter.cli.dev/) is a capability firewall between AI
  agents and external services.
- [Reploy](https://reploy.cli.dev/) is a deployment lifecycle tool for staging,
  testing, installing, and operating services from portable blueprints.
- [OmegaFlow](https://omegaflow.dev/) turns scripted terminal workflows into
  repeatable videos.

The umbrella is intentionally broader than open source. Many of these projects
are open source, and open source remains important to me, but cli.dev is not a
license category. It is a home for related work. Future additions may be open
source tools, hosted products, or experiments that do not fit neatly into
either category.

For me, cli.dev is a way to make the larger body of work visible without
pretending that every project is the same kind of thing. I expect the directory
to evolve as the projects mature and as new ones become ready to share.

Visit [cli.dev](https://cli.dev/) to explore the ecosystem.
