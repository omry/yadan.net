---
slug: introducing-llm-auth
title: Introducing llm-auth
authors: [omry]
tags: [engineering, projects, open-source]
description: A small introduction to llm-auth, a local credential manager for LLM developer tooling.
---

`llm-auth` is a small local credential manager for LLM developer tools. It
keeps API-key and subscription-OAuth credentials in a project `.env` file, with
metadata that makes each auth surface discoverable, testable, and refreshable.

The motivating problem is simple: local scripts, benchmarks, evals, and agent
runners often need access to several LLM providers, but the credentials tend to
end up scattered across shell profiles, one-off env files, and provider-specific
token stores.

<!-- truncate -->

`llm-auth` treats those credentials as named surfaces:

```bash
llm-auth add-api-key research openai --model gpt-4.1-mini
llm-auth login chatgpt
llm-auth status
llm-auth test research
```

For API keys, it writes a metadata envelope around the env var so tools can
tell which provider, model, API base, and auth mode belong to a surface. For
ChatGPT subscription OAuth, it uses LiteLLM's ChatGPT provider and stores the
resulting OAuth record in the same local auth store.

The current version also errs on the cautious side. It refuses to use `.env`
files with broad file permissions, and in Git, Sapling, and Mercurial
repositories it checks that the file is ignored, untracked, and not already in
commit history.

This is deliberately modest tooling. It is not a hosted secret manager and it
does not try to replace a password manager or system key store. It is the small
piece I wanted between "put this key somewhere" and "every script invents its
own credential convention."

Install it from PyPI:

```bash
python -m pip install llm-auth
```

The project is on [GitHub](https://github.com/omry/llm-auth), on
[PyPI](https://pypi.org/project/llm-auth/), and the
[README](https://github.com/omry/llm-auth#readme) covers the `login`, `renew`,
`status`, `test`, and `add-api-key` commands.
