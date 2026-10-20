# Yadan.net

Personal website for Omry Yadan, published at <https://yadan.net>.

The site is a small Docusaurus app with project context, blog and writing
sections, short background context, and a standalone contact form.

## Stack

- Docusaurus `3.10.1`
- React pages in `src/pages/`
- Shared content data in `src/data/siteContent.js`
- Shared styling in `src/css/custom.css` and `src/pages/index.module.css`
- Blog posts in `blog/`
- Longer-form articles in `writing/`
- Static assets in `static/`
- GitHub Pages deployment through GitHub Actions

## Development

Install dependencies:

```bash
npm install --global npm@11.9.0
npm ci
```

Start the local dev server:

```bash
npm run start
```

Build the production site:

```bash
npm run build
```

Preview the production build:

```bash
npm run serve
```

## Deployment

Pushing to `main` runs `.github/workflows/pages.yml`, builds the site, and
publishes the generated `build/` directory to GitHub Pages.

The custom domain is configured with `static/CNAME`:

```txt
yadan.net
```

`static/.nojekyll` is included so GitHub Pages serves the generated files
directly.

## Contact Form

The contact page posts to Formspree using the public form ID configured in
`docusaurus.config.js`. The recipient address, reCAPTCHA secret key, and spam
controls live in the Formspree dashboard, not in this repository.

The public reCAPTCHA v3 site key is configured in `docusaurus.config.js`. To
override it locally or while rotating keys, build the site with:

```bash
RECAPTCHA_SITE_KEY=your-public-site-key npm run build
```

## Lab

`/lab/` lists the interactive experiments. Airport Time / Space is maintained in
[its own repository](https://github.com/omry/airport-time-space) and published at
`/lab/airport-time-space/`. The existing start and build commands download the
release pinned in `lab/airport-time-space.release.json`, verify its SHA-256,
and extract it into the ignored `static/lab/airport-time-space/` directory.
The archive is cached locally under `.cache/airport-time-space/`; subsequent
builds can use that cache without downloading the app again.

To deploy an app update, publish a release in the app repository and update
the pinned archive URL and SHA-256 here. The app repository documents standalone
use, tests, CSV format, and data provenance.

## Dependency maintenance

Use Node 24 and npm 11.9.0, matching the project declarations. Install the
pinned npm version with `npm install --global npm@11.9.0`, then use `npm ci`.

The [Node maintenance workflows](https://github.com/hydra-ecosystem/github-actions/blob/main/docs/node-maintenance.md)
check security every Monday at 02:00 UTC and propose routine upgrades quarterly,
on January 1, April 1, July 1, and October 1 at 02:00 UTC. New releases have a
ten-day cooldown. The local `.github/node-maintenance.json` points to the shared
policy; edit its overrides to change project policy, and keep caller cron entries
in `.github/workflows/dependency-audit.yml` consistent with the resolved schedule.

To run an audit sooner, open **Actions → Node dependency maintenance → Run workflow**
on `main` and select `security` or `upgrades`. The action validates dependency
changes before opening or updating one maintenance PR. A toolchain or schedule
mismatch fails preflight and opens or updates a configuration issue. The action
does not rewrite toolchain declarations.

Publication uses the built-in token and requires **Allow GitHub Actions to create
and approve pull requests** in **Settings → Actions → General → Workflow
permissions**. Default token permissions remain read-only. The workflow does
not approve or merge its own PRs.
