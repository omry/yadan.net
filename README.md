# Yadan.net

Initial static scaffold for Omry Yadan's personal website.

## Intent

- Personal project and CV showcase, not a recruiting site.
- Backend-less by default so Apache can serve it directly.
- Canonical host recommendation: `yadan.net`, with `omry.yadan.net` kept as a future alias/subdomain if desired.

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment notes for Apache

Copy the repository contents (or just `index.html` and `assets/`) into the Apache document root for the chosen virtual host.

A minimal virtual host can point either `yadan.net` or `omry.yadan.net` at the same directory. If both names are enabled, prefer redirecting one to the canonical name to avoid duplicate URLs.

## Content status

The current copy is intentionally conservative and should be refined with authoritative details before launch, especially:

- exact CV dates and role descriptions;
- preferred contact channels;
- the canonical Rakia link and project description;
- HoodleFinance positioning and launch/status details.
