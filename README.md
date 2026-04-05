# LAO WU CHINA USED CARS

A modern, responsive car marketplace website built from static assets with direct image references to the `Lao Wu china images` folder.

## Features

- Responsive homepage with hero banner, featured carousel, category quick-links, and filtered search.
- Dedicated car detail pages with image gallery, specs, and contact actions.
- Compare up to 3 vehicles side-by-side.
- Wishlist/favorites stored in browser localStorage.
- Progressive Web App support with offline caching.
- Cookie consent banner, SEO-ready metadata, sitemap, and robots.txt.
- Local JSON dataset via `data/listings.json`.

## Folder structure

- `index.html` — homepage
- `about.html` — about and policy page
- `compare.html` — comparison page
- `car.html` — single car detail page
- `assets/css/styles.css` — global styles
- `assets/js/app.js` — page logic and listing behavior
- `assets/js/auth.js` — demo authentication UI
- `data/listings.json` — car listing metadata
- `service-worker.js` — PWA cache logic
- `manifest.webmanifest` — PWA manifest
- `robots.txt` and `sitemap.xml`

## How to use

1. Place the `Lao Wu china images` folder in the site root alongside `index.html`.
2. Open `index.html` through a web server, or deploy the repository to GitHub Pages / Vercel.
3. Browse listings, select cars, and compare side-by-side.

## Recommended deployment

### GitHub Pages

1. Initialize Git if needed:
   ```bash
git init
git add .
git commit -m "Initial LAO WU CHINA USED CARS website"
   ```
2. Push to a GitHub repository.
3. Enable GitHub Pages from the repository settings.

### Vercel (recommended)

1. Sign in at [vercel.com](https://vercel.com).
2. Import the repository.
3. Deploy the project as a static site.

## Notes

- The website uses a local JSON file for listings and direct image references to the existing image folder.
- Authentication is currently implemented as a demo local login UI and can be extended with Firebase by adding your Firebase config to `assets/js/auth.js`.
- All external APIs and paid services are intentionally excluded.
