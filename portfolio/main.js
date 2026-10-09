(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Footer year and scroll progress.
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  const progress = $("#readingProgress");
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Accessible mobile navigation.
  const menuButton = $("#menuButton");
  const nav = $("#siteNav");
  const closeNav = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("open");
    document.body.classList.remove("nav-open");
  };
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const opening = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(opening));
      menuButton.setAttribute("aria-label", opening ? "Close navigation" : "Open navigation");
      nav.classList.toggle("open", opening);
      document.body.classList.toggle("nav-open", opening);
    });
    $$("a", nav).forEach(link => link.addEventListener("click", closeNav));
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeNav(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 650) closeNav(); });
  }

  // Reveal sections only when IntersectionObserver is available.
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -25px 0px" });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  // Robust profile photo loader: tries the common extensions in order.
  // Required paths are assets/images/stqrkvi.jpg and assets/images/zero.jpg.
  const imageExtensions = ["jpg", "jpeg", "png", "webp"];
  $$(".profile-image").forEach(img => {
    const name = img.dataset.profile;
    if (!name) return;
    const fallback = img.parentElement.querySelector(".avatar-fallback");
    let index = 0;
    const tryNext = () => {
      if (index >= imageExtensions.length) {
        img.hidden = true;
        if (fallback) fallback.style.display = "grid";
        return;
      }
      img.hidden = false;
      if (fallback) fallback.style.display = "none";
      img.src = `assets/images/${name}.${imageExtensions[index++]}`;
    };
    img.addEventListener("error", tryNext);
    img.addEventListener("load", () => {
      img.hidden = false;
      if (fallback) fallback.style.display = "none";
    });
    // The initial HTML src may have already failed before this handler was attached.
    img.addEventListener("error", () => {
      if (index >= imageExtensions.length && fallback) fallback.style.display = "grid";
    });
    tryNext();
  });

  // Copy Discord IDs with a visible, non-intrusive toast.
  const toast = $("#toast");
  let toastTimer;
  const showToast = message => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
  };
  $$(".copy-button").forEach(button => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy || "";
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
        } else {
          const field = document.createElement("textarea");
          field.value = value;
          field.readOnly = true;
          field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
          document.body.appendChild(field);
          field.select();
          const ok = document.execCommand("copy");
          field.remove();
          if (!ok) throw new Error("Clipboard unavailable");
        }
        showToast(`Copied Discord ID: ${value}`);
      } catch {
        showToast(`Copy manually: ${value}`);
      }
    });
  });

  // Gentle desktop-only parallax for the abstract hero rings.
  const visual = $(".visual-frame");
  const rings = $$(".ring", visual || document);
  if (visual && rings.length && window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    visual.addEventListener("pointermove", event => {
      const rect = visual.getBoundingClientRect();
      const dx = (event.clientX - rect.left) / rect.width - 0.5;
      const dy = (event.clientY - rect.top) / rect.height - 0.5;
      rings.forEach((ring, i) => {
        ring.style.marginLeft = `${dx * (i + 1) * 8}px`;
        ring.style.marginTop = `${dy * (i + 1) * 8}px`;
      });
    });
    visual.addEventListener("pointerleave", () => rings.forEach(ring => {
      ring.style.marginLeft = "0";
      ring.style.marginTop = "0";
    }));
  }
})();
