(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Footer year
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Scroll progress
  const progressBar = $("#progressBar");
  const updateProgress = () => {
    if (!progressBar) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Mobile navigation
  const menuToggle = $("#menuToggle");
  const nav = $("#nav");
  const closeMenu = () => {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
  };
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("open", !expanded);
      document.body.classList.toggle("menu-open", !expanded);
    });
    $$("a", nav).forEach(link => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => { if (window.innerWidth > 650) closeMenu(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
  }

  // Scroll reveal; keep content visible if observer isn't supported.
  const revealElements = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealElements.forEach(element => observer.observe(element));
  } else {
    revealElements.forEach(element => element.classList.add("is-visible"));
  }

  // Copy Discord ID with fallback for browsers where clipboard permissions are unavailable.
  const copyButton = $("#copyDiscord");
  const feedback = $("#copyFeedback");
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const value = copyButton.dataset.copy || "";
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
        } else {
          const temporary = document.createElement("textarea");
          temporary.value = value;
          temporary.setAttribute("readonly", "");
          temporary.style.position = "fixed";
          temporary.style.opacity = "0";
          document.body.appendChild(temporary);
          temporary.select();
          const copied = document.execCommand("copy");
          temporary.remove();
          if (!copied) throw new Error("Copy command unavailable");
        }
        if (feedback) feedback.textContent = `Copied Discord ID: ${value}`;
        copyButton.innerHTML = "Copied <span>✓</span>";
        window.setTimeout(() => {
          copyButton.innerHTML = "Copy Discord ID <span>⧉</span>";
          if (feedback) feedback.textContent = "";
        }, 2400);
      } catch (error) {
        if (feedback) feedback.textContent = `Copy manually: ${value}`;
      }
    });
  }

  // Subtle cursor parallax on the hero artwork (disabled for touch/reduced-motion).
  const art = $(".hero-art");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (art && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    const orbits = $$(".orbit", art);
    art.addEventListener("mousemove", event => {
      const rect = art.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      orbits.forEach((orbit, index) => {
        orbit.style.translate = `${x * (index + 1) * 7}px ${y * (index + 1) * 7}px`;
      });
    });
    art.addEventListener("mouseleave", () => {
      orbits.forEach(orbit => { orbit.style.translate = "0 0"; });
    });
  }
})();
