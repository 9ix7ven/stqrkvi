STQRKVI × ZERO portfolio — separated source files

Files:
- index.html: page structure
- css/style.css: custom CSS extracted from the original HTML
- js/tailwind-config.js: Tailwind theme configuration
- js/main.js: clipboard/toast/contact-form and scroll progress scripts

Run locally:
1. Keep the folder structure unchanged.
2. Open index.html in a browser. An internet connection is needed for Google Fonts and the Tailwind CDN.

Deployment:
Upload index.html plus the css/ and js/ folders together to your hosting. Keep relative paths intact.

Note: This split preserves the source content. The contact form currently shows a client-side success message; it is not connected to an email/API backend. Verify project URLs, email, profile links, metrics, and other demo content before publishing.
