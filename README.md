# Yadan.net

Personal website for Omry Yadan, published at <https://yadan.net>.

The site is a small Docusaurus app with project context, a blog section, short
background context, and a standalone contact form.

## Stack

- Docusaurus `3.10.1`
- React pages in `src/pages/`
- Shared content data in `src/data/siteContent.js`
- Shared styling in `src/css/custom.css` and `src/pages/index.module.css`
- Blog posts in `blog/`
- Static assets in `static/`
- GitHub Pages deployment through GitHub Actions

## Development

Install dependencies:

```bash
npm install
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
