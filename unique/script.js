/* =========================================================
   UNIQUE — interactions and animation controller
   No framework, no backend, no API key.
   ========================================================= */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* =======================================================
     01. Editable settings
     Personalise the note here without changing the layout.
     ======================================================= */
  const SETTINGS = {
    rotationDuration: 4200,
    particleCount: 66,
    secretMessage:
      "Unique, this little corner is for the feelings that are not always easy to explain. Some people leave a little light in ordinary moments, and sometimes that is already something special. This page is a small reminder of that feeling. ♡",
    toastDuration: 2300
  };

  const languages = [
    { phrase: "I love you.", language: "English", flag: "🇬🇧" },
    { phrase: "Je t’aime.", language: "French", flag: "🇫🇷" },
    { phrase: "Te amo.", language: "Spanish", flag: "🇪🇸" },
    { phrase: "Ich liebe dich.", language: "German", flag: "🇩🇪" },
    { phrase: "Ti amo.", language: "Italian", flag: "🇮🇹" },
    { phrase: "愛してる", language: "Japanese", flag: "🇯🇵" },
    { phrase: "사랑해", language: "Korean", flag: "🇰🇷" },
    { phrase: "我爱你", language: "Chinese", flag: "🇨🇳" },
    { phrase: "मैं तुमसे प्यार करता हूँ", language: "Hindi", flag: "🇮🇳" },
    { phrase: "میں تم سے محبت کرتا ہوں", language: "Urdu", flag: "🇵🇰" },
    { phrase: "أحبك", language: "Arabic", flag: "🌙" },
    { phrase: "Я тебя люблю", language: "Russian", flag: "🇷🇺" },
    { phrase: "Ik hou van jou.", language: "Dutch", flag: "🇳🇱" },
    { phrase: "Jag älskar dig.", language: "Swedish", flag: "🇸🇪" },
    { phrase: "Jeg elsker deg.", language: "Norwegian", flag: "🇳🇴" },
    { phrase: "Seni seviyorum.", language: "Turkish", flag: "🇹🇷" },
    { phrase: "Kocham cię.", language: "Polish", flag: "🇵🇱" },
    { phrase: "Eu te amo.", language: "Portuguese", flag: "🇵🇹" },
    { phrase: "Σ' αγαπώ.", language: "Greek", flag: "🇬🇷" },
    { phrase: "Aku cinta kamu.", language: "Indonesian", flag: "🇮🇩" }
  ];

  const els = {
    canvas: $("#particleCanvas"),
    phrase: $("#languagePhrase"),
    language: $("#languageName"),
    counter: $("#languageCounter"),
    progress: $("#languageProgress"),
    next: $("#nextLanguage"),
    previous: $("#previousLanguage"),
    pauseLanguages: $("#pauseLanguages"),
    heart: $("#heartButton"),
    scene: $("#heartScene"),
    soundToggle: $("#soundToggle"),
    soundGlyph: $("#soundGlyph"),
    pauseMotion: $("#pauseMotion"),
    openLetter: $("#openLetter"),
    modal: $("#letterModal"),
    modalBackdrop: $("#modalBackdrop"),
    closeLetter: $("#closeLetter"),
    modalText: $("#modalText"),
    replay: $("#replayExperience"),
    share: $("#sharePage"),
    toast: $("#toast"),
    menuToggle: $("#menuToggle"),
    nav: $(".header-nav")
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentLanguage = 0;
  let languagePaused = false;
  let motionPaused = false;
  let soundEnabled = false;
  let audioContext = null;
  let progressStartedAt = 0;
  let progressElapsed = 0;
  let progressFrame = null;
  let toastTimer = null;
  let languageTimeout = null;
  let lastFocusedElement = null;
  let animationFrame = null;
  let lastFrameTime = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let particles = [];

  /* =======================================================
     02. Utility helpers
     ======================================================= */
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function wrapIndex(index, length) {
    return ((index % length) + length) % length;
  }

  function formatCounter(number, total) {
    return `${String(number).padStart(2, "0")} <i>/</i> ${String(total).padStart(2, "0")}`;
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, SETTINGS.toastDuration);
  }

  function prefersReducedMotion() {
    return reducedMotion.matches || motionPaused;
  }

  /* =======================================================
     03. Background particles
     ======================================================= */
  const context = els.canvas ? els.canvas.getContext("2d") : null;

  function resizeCanvas() {
    if (!els.canvas || !context) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;

    els.canvas.width = Math.round(canvasWidth * ratio);
    els.canvas.height = Math.round(canvasHeight * ratio);
    els.canvas.style.width = `${canvasWidth}px`;
    els.canvas.style.height = `${canvasHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const density = Math.round((canvasWidth * canvasHeight) / 16500);
    const amount = clamp(density, 20, SETTINGS.particleCount);

    particles = Array.from({ length: amount }, () => ({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      radius: Math.random() * 1.25 + 0.35,
      alpha: Math.random() * 0.42 + 0.12,
      speed: Math.random() * 0.24 + 0.045,
      drift: (Math.random() - 0.5) * 0.18,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function drawParticles(time = 0) {
    if (!context || document.hidden) {
      animationFrame = null;
      return;
    }

    const delta = lastFrameTime
      ? Math.min((time - lastFrameTime) / 16.67, 2)
      : 1;

    lastFrameTime = time;
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    for (const particle of particles) {
      if (!prefersReducedMotion()) {
        particle.y -= particle.speed * delta;
        particle.x += particle.drift * delta;
        particle.phase += 0.013 * delta;
      }

      if (particle.y < -4) {
        particle.y = canvasHeight + 4;
        particle.x = Math.random() * canvasWidth;
      }

      if (particle.x < -4) particle.x = canvasWidth + 4;
      if (particle.x > canvasWidth + 4) particle.x = -4;

      const shimmer = prefersReducedMotion()
        ? 1
        : 0.68 + Math.sin(particle.phase) * 0.32;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 139, 190, ${particle.alpha * shimmer})`;
      context.fill();
    }

    animationFrame = window.requestAnimationFrame(drawParticles);
  }

  function startParticles() {
    if (animationFrame !== null || document.hidden) return;
    lastFrameTime = 0;
    animationFrame = window.requestAnimationFrame(drawParticles);
  }

  function stopParticles() {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    lastFrameTime = 0;
  }

  /* =======================================================
     04. Language carousel
     ======================================================= */
  function renderLanguage(index, animate = true) {
    currentLanguage = wrapIndex(index, languages.length);
    const item = languages[currentLanguage];

    els.phrase.textContent = item.phrase;
    els.language.textContent = `${item.language} · ${item.flag}`;
    els.counter.innerHTML = formatCounter(currentLanguage + 1, languages.length);

    if (animate && !prefersReducedMotion() && typeof els.phrase.animate === "function") {
      els.phrase.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: 360, easing: "cubic-bezier(.2,.75,.25,1)" }
      );
    }

    progressElapsed = 0;
    progressStartedAt = performance.now();
    els.progress.style.width = "0%";
  }

  function cancelLanguageTimers() {
    window.clearTimeout(languageTimeout);
    if (progressFrame !== null) {
      window.cancelAnimationFrame(progressFrame);
      progressFrame = null;
    }
    languageTimeout = null;
  }

  function progressTick(now) {
    if (languagePaused || document.hidden || motionPaused) return;

    const elapsed = progressElapsed + (now - progressStartedAt);
    const percentage = clamp((elapsed / SETTINGS.rotationDuration) * 100, 0, 100);
    els.progress.style.width = `${percentage}%`;

    if (percentage >= 100) {
      progressFrame = null;
      renderLanguage(currentLanguage + 1);
      scheduleLanguageRotation();
      return;
    }

    progressFrame = window.requestAnimationFrame(progressTick);
  }

  function scheduleLanguageRotation() {
    cancelLanguageTimers();

    if (languagePaused || document.hidden || motionPaused) return;

    progressStartedAt = performance.now();
    progressFrame = window.requestAnimationFrame(progressTick);
  }

  function goToNextLanguage() {
    renderLanguage(currentLanguage + 1);
    playChime();
    scheduleLanguageRotation();
  }

  function goToPreviousLanguage() {
    renderLanguage(currentLanguage - 1);
    playChime();
    scheduleLanguageRotation();
  }

  function toggleLanguagePause() {
    languagePaused = !languagePaused;

    if (languagePaused) {
      if (progressFrame !== null) {
        progressElapsed += performance.now() - progressStartedAt;
      }
      cancelLanguageTimers();
      els.pauseLanguages.textContent = "▶";
      els.pauseLanguages.setAttribute("aria-label", "Resume language rotation");
      els.pauseLanguages.title = "Resume rotation";
      showToast("Language rotation paused. Take your time. ♡");
    } else {
      els.pauseLanguages.textContent = "Ⅱ";
      els.pauseLanguages.setAttribute("aria-label", "Pause language rotation");
      els.pauseLanguages.title = "Pause rotation";
      scheduleLanguageRotation();
      showToast("The words are moving again. ♡");
    }
  }

  /* =======================================================
     05. Optional synthesized chime
     No music files or third-party audio required.
     ======================================================= */
  function playChime() {
    if (!soundEnabled) return;

    try {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) return;

      if (!audioContext) audioContext = new AudioContextConstructor();
      if (audioContext.state === "suspended") audioContext.resume();

      const now = audioContext.currentTime;
      const notes = [523.25, 659.25];

      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const startAt = now + index * 0.105;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.035, startAt + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.32);
      });
    } catch (error) {
      console.warn("The optional chime is unavailable.", error);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    els.soundGlyph.textContent = soundEnabled ? "♫" : "♪";
    els.soundToggle.setAttribute(
      "aria-label",
      soundEnabled ? "Turn gentle chimes off" : "Turn gentle chimes on"
    );
    els.soundToggle.style.background = soundEnabled ? "rgba(255,79,150,.12)" : "";
    els.soundToggle.style.borderColor = soundEnabled ? "rgba(255,114,165,.4)" : "";

    if (soundEnabled) playChime();
    showToast(soundEnabled ? "Gentle chimes enabled. ♡" : "Sound turned off.");
  }

  /* =======================================================
     06. Heart click burst
     ======================================================= */
  function createHeartBurst() {
    if (!els.scene || !els.heart) return;

    const sceneRect = els.scene.getBoundingClientRect();
    const heartRect = els.heart.getBoundingClientRect();
    const originX = heartRect.left + heartRect.width / 2 - sceneRect.left;
    const originY = heartRect.top + heartRect.height / 2 - sceneRect.top;
    const glyphs = ["♥", "♡", "✦", "✧"];

    for (let index = 0; index < 18; index += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * index) / 18;
      const distance = 48 + Math.random() * 75;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;

      particle.textContent = glyphs[index % glyphs.length];
      particle.setAttribute("aria-hidden", "true");

      Object.assign(particle.style, {
        position: "absolute",
        zIndex: "8",
        left: `${originX}px`,
        top: `${originY}px`,
        pointerEvents: "none",
        color: index % 2 ? "#ffafd0" : "#ff4f96",
        fontSize: `${10 + Math.random() * 10}px`
      });

      els.scene.appendChild(particle);

      const animation = particle.animate(
        [
          {
            transform: "translate(-50%, -50%) scale(.3) rotate(0deg)",
            opacity: 0.95
          },
          {
            transform:
              `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)) ` +
              `scale(1.1) rotate(${Math.random() * 90 - 45}deg)`,
            opacity: 0
          }
        ],
        {
          duration: prefersReducedMotion() ? 1 : 650 + Math.random() * 350,
          easing: "cubic-bezier(.16,.7,.3,1)"
        }
      );

      animation.onfinish = () => particle.remove();
    }

    if (typeof els.heart.animate === "function") {
      els.heart.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.13)" },
          { transform: "scale(1)" }
        ],
        { duration: prefersReducedMotion() ? 1 : 340 }
      );
    }

    playChime();
  }

  /* =======================================================
     07. Secret letter dialog
     ======================================================= */
  function openLetter() {
    lastFocusedElement = document.activeElement;
    els.modal.classList.add("is-open");
    els.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    els.closeLetter.focus();
  }

  function closeLetter() {
    els.modal.classList.remove("is-open");
    els.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function keepFocusInsideModal(event) {
    if (!els.modal.classList.contains("is-open") || event.key !== "Tab") return;

    const focusable = $$(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      els.modal
    ).filter((element) => element.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* =======================================================
     08. Mobile navigation
     ======================================================= */
  function toggleMenu(forceState) {
    const shouldOpen = typeof forceState === "boolean"
      ? forceState
      : !els.nav.classList.contains("is-open");

    els.nav.classList.toggle("is-open", shouldOpen);
    els.menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    els.menuToggle.setAttribute(
      "aria-label",
      shouldOpen ? "Close navigation" : "Open navigation"
    );
  }

  /* =======================================================
     09. Pause and resume page motion
     ======================================================= */
  function toggleMotion() {
    motionPaused = !motionPaused;
    document.body.classList.toggle("motion-paused", motionPaused);
    els.pauseMotion.textContent = motionPaused ? "Resume motion" : "Pause motion";

    if (motionPaused) {
      if (progressFrame !== null) {
        progressElapsed += performance.now() - progressStartedAt;
      }
      cancelLanguageTimers();
      stopParticles();
      showToast("Animations paused. The feeling stays. ♡");
    } else {
      scheduleLanguageRotation();
      startParticles();
      showToast("The little universe is moving again. ♡");
    }
  }

  /* =======================================================
     10. Share page
     ======================================================= */
  async function sharePage() {
    const shareData = {
      title: document.title,
      text: "A little world made of feelings. ♡",
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Website link copied. Share it with someone special. ♡");
        return;
      }

      showToast("Copy the website link from your browser address bar. ♡");
    } catch (error) {
      if (error && error.name === "AbortError") return;
      showToast("Copy the website link from your browser address bar. ♡");
    }
  }

  /* =======================================================
     11. Restart the experience
     ======================================================= */
  function replayExperience() {
    languagePaused = false;
    currentLanguage = 0;
    progressElapsed = 0;

    els.pauseLanguages.textContent = "Ⅱ";
    els.pauseLanguages.setAttribute("aria-label", "Pause language rotation");
    els.pauseLanguages.title = "Pause rotation";

    renderLanguage(0, false);
    scheduleLanguageRotation();

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });

    showToast("Back to the beginning. ♡");
  }

  /* =======================================================
     12. Reveal sections as they enter the viewport
     ======================================================= */
  function setupReveal() {
    const revealItems = $$(".reveal");

    if (!("IntersectionObserver" in window) || reducedMotion.matches) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -35px 0px"
    });

    revealItems.forEach((item) => observer.observe(item));
  }

  /* =======================================================
     13. Event wiring
     ======================================================= */
  els.next.addEventListener("click", goToNextLanguage);
  els.previous.addEventListener("click", goToPreviousLanguage);
  els.pauseLanguages.addEventListener("click", toggleLanguagePause);
  els.heart.addEventListener("click", createHeartBurst);
  els.soundToggle.addEventListener("click", toggleSound);
  els.pauseMotion.addEventListener("click", toggleMotion);
  els.openLetter.addEventListener("click", openLetter);
  els.closeLetter.addEventListener("click", closeLetter);
  els.modalBackdrop.addEventListener("click", closeLetter);
  els.replay.addEventListener("click", replayExperience);
  els.share.addEventListener("click", sharePage);
  els.menuToggle.addEventListener("click", () => toggleMenu());

  $$(".header-nav a").forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (els.modal.classList.contains("is-open")) closeLetter();
      toggleMenu(false);
    }

    keepFocusInsideModal(event);

    if (
      event.code === "Space" &&
      !els.modal.classList.contains("is-open") &&
      !["BUTTON", "INPUT", "TEXTAREA", "A", "SELECT"].includes(
        document.activeElement.tagName
      )
    ) {
      event.preventDefault();
      toggleLanguagePause();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (progressFrame !== null) {
        progressElapsed += performance.now() - progressStartedAt;
      }
      cancelLanguageTimers();
      stopParticles();
      return;
    }

    if (!languagePaused && !motionPaused) scheduleLanguageRotation();
    startParticles();
  });

  window.addEventListener("resize", resizeCanvas, { passive: true });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        $$(".reveal").forEach((element) => element.classList.add("is-visible"));
      }
    });
  }

  /* =======================================================
     14. Initialise the page
     ======================================================= */
  els.modalText.textContent = SETTINGS.secretMessage;
  resizeCanvas();
  setupReveal();
  renderLanguage(0, false);

  if (!document.hidden) {
    startParticles();
    scheduleLanguageRotation();
  }
})();
