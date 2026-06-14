---
slug: introducing-stale-buffer-guard
title: Introducing Stale Buffer Guard for VS Code
authors: [omry]
tags: [engineering, projects, open-source]
description: Stops open VS Code tabs from showing old text after version control, formatters, or agents change files on disk; warns when unsaved edits are based on an older version.
---

You argue with your AI agent about what is in a file you already have open,
only to realize later that you were looking at different versions. The agent
was reading the file on disk; your editor was still showing an older buffer
from before that disk change.

That mismatch is easy to miss. Version control, formatters, and agents can
all change files outside the editor. When an editor tab
keeps presenting stale text, you can ask your agent to fix something it
already fixed, miss a generated change, or make a manual edit from old
information.

<!-- truncate -->

Stale Buffer Guard is for catching that mismatch while you are still working,
before your next prompt or save is based on stale text.

It watches the active editor and keeps track of the disk
modified time that belonged to the editor's saved baseline. When VS Code updates
a clean document from disk, the extension moves its baseline forward too. If the
editor is dirty and the file on disk is newer than that baseline, it makes the
stale state visible earlier, before the save-time overwrite warning interrupts
you.

The warning shows up in two places:

- a visible background across the editor buffer, and
- a status bar item.

The extension is on
[GitHub](https://github.com/omry/stale-buffer-guard) and on the
[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=omry.stale-buffer-guard).
