---
slug: introducing-agent-skill-installer
title: Introducing Agent Skill Installer
authors: [omry]
tags: [engineering, projects, open-source]
description: A short introduction to Agent Skill Installer, a small tool for installing Codex and Claude Code skills from GitHub, PyPI, local checkouts, and local wheel files.
---

Agent Skill Installer started as a by-product of another project I am working
on. That project needed to install a skill reliably and easily, and the
installer came out useful enough that I decided to make it available more
generally.

Agent skills are useful when they are easy to try. The awkward part is usually
not writing `SKILL.md`; it is getting the files into the right place, making the
agent aware of them, and later remembering exactly what was installed.

Agent Skill Installer is a small Python tool for that part of the job. It
installs Codex and Claude Code skills from GitHub, PyPI, a local checkout, or a
local wheel file. Installation can be global for the current user or specific to
a repository.

<!-- truncate -->

<p>
  <a href="/img/projects/agent-skill-installer/ui-install.png">
    <img
      src="/img/projects/agent-skill-installer/ui-install.png"
      alt="Agent Skill Installer interactive source picker"
      width="720"
    />
  </a>
</p>

Copying a skill into place by hand is fine once. Doing it repeatedly, across
different repositories, different agents, and different packaging shapes, starts
to feel like a checklist that should belong to a tool.

The installer keeps the surface deliberately narrow. A local checkout is useful
while developing a skill. A local wheel file is useful when testing the exact
artifact you plan to publish. GitHub and PyPI are useful once the skill is ready
to share. The install target can be the current repository, or the user's global
agent home.

For scripts and CI, the no-UI path is explicit:

```bash
agent-skill-installer --no-ui install \
  --skill-path ./my-skill \
  --editable \
  --agent codex \
  --scope repo
```

For humans, the terminal UI walks through the same choices: install or
uninstall, source, target agent, and install scope.

Skill authors can also include an optional `agent-skill-installer.yaml` next to
`SKILL.md` to customize the discoverability text written for Codex or Claude
Code. The format also has agent-specific sections for vendor-specific hook
mechanisms instead of pretending every agent exposes the same shape. For
example, a packaged skill can carry Codex hook config such as `UserPromptSubmit`,
`PreToolUse`, or `SessionStart`, and Claude Code hook config such as
`UserPromptSubmit`, `PreToolUse`, `Notification`, or `PreCompact`.

The installer validates that config against its local schema during
installation, so packaging mistakes fail early instead of quietly landing in a
user's agent setup.

None of this is meant to be grand. The goal is to make installing agent skills
pleasant instead of daunting, especially when moving from "this works on my
machine" to "someone else can install this too."

Install it from PyPI:

```bash
python -m pip install agent-skill-installer
```

The project is on
[GitHub](https://github.com/omry/agent-skill-installer), on
[PyPI](https://pypi.org/project/agent-skill-installer/), and the
[README](https://github.com/omry/agent-skill-installer#readme) links to the
installation, authoring, packaging, and API guides.
