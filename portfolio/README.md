# STQRKVI × ZERO: portfolio

Static site: plain HTML, CSS and JavaScript. No build step, no dependencies.

```
index.html
css/style.css
js/main.js        <- CONFIG block at the top: links, IDs, email
assets/images/    <- stqrkvi.jpg and zero.png
```

## Setup
1. Put the two photos in `assets/images/` as `stqrkvi.jpg` and `zero.png` (square, ~400×400, under 100 KB). Without them the site shows letter avatars.
2. Open `js/main.js` and fill in `CONFIG`. Only values you set are shown: Live Demo / Source Code buttons, social links, Discord ID, email. Nothing is invented.
3. Preview locally: `python3 -m http.server 8000`, then open http://localhost:8000.

## Deploy
All paths are relative, so it works at a domain root or in a subdirectory such as `/portfolio/`.
- **Any static host / VPS:** upload the folder's contents to the target directory.
- **GitHub Pages / Netlify / Vercel / Railway static:** point to this folder, no build command, publish directory `.`.

## Notes
- Fonts (Space Grotesk) and tech icons (Devicon) load from CDNs; fallbacks are built in if they're blocked.
- Respects `prefers-reduced-motion`. Keyboard navigation and visible focus states included.
- Update `<title>`, description and Open Graph tags in `index.html` once your final URL is set.
