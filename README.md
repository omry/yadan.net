# Yadan.net

Initial static scaffold for Omry Yadan's personal website.

## Intent

- Personal project and CV showcase, not a recruiting site.
- Backend-less by default so static hosts can serve it directly.
- Canonical host recommendation: `yadan.net`, with `omry.yadan.net` kept as a future alias/subdomain if desired.

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment notes for GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/pages.yml` that publishes the repository root as a static GitHub Pages site whenever changes are pushed to `main`. It can also be started manually from the Actions tab with **Run workflow**.

Initial setup in GitHub:

1. Open the repository **Settings** tab.
2. Go to **Pages**.
3. Set **Build and deployment** → **Source** to **GitHub Actions**.
4. Push to `main` or run the `Deploy static site to GitHub Pages` workflow manually.
5. If using the custom domain, keep the root `CNAME` file set to `yadan.net` and configure DNS with the GitHub Pages records for the apex domain.

The `.nojekyll` file tells GitHub Pages to publish the static files exactly as provided instead of running Jekyll.

## Deployment notes for Apache

Copy the repository contents (or just `index.html` and `assets/`) into the Apache document root for the chosen virtual host.

A minimal virtual host can point either `yadan.net` or `omry.yadan.net` at the same directory. If both names are enabled, prefer redirecting one to the canonical name to avoid duplicate URLs.

## Content status

The current copy is intentionally conservative and should be refined with authoritative details before launch, especially:

- exact CV dates and role descriptions;
- preferred contact channels;
- the canonical Rakia link and project description;
- HoodleFinance positioning and launch/status details.
