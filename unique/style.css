
(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const phrases = [
    ["I love you.", "English", "🇬🇧"],
    ["Je t’aime.", "French", "🇫🇷"],
    ["Te amo.", "Spanish", "🇪🇸"],
    ["Ich liebe dich.", "German", "🇩🇪"],
    ["Ti amo.", "Italian", "🇮🇹"],
    ["愛してる", "Japanese", "🇯🇵"],
    ["사랑해", "Korean", "🇰🇷"],
    ["我爱你", "Chinese", "🇨🇳"],
    ["मैं तुमसे प्यार करता हूँ", "Hindi", "🇮🇳"],
    ["میں تم سے محبت کرتا ہوں", "Urdu", "🇵🇰"],
    ["أحبك", "Arabic", "🌙"],
    ["Я тебя люблю", "Russian", "🇷🇺"],
    ["Ik hou van jou.", "Dutch", "🇳🇱"],
    ["Jag älskar dig.", "Swedish", "🇸🇪"],
    ["Jeg elsker deg.", "Norwegian", "🇳🇴"],
    ["Seni seviyorum.", "Turkish", "🇹🇷"],
    ["Kocham cię.", "Polish", "🇵🇱"],
    ["Eu te amo.", "Portuguese", "🇵🇹"],
    ["Σ' αγαπώ.", "Greek", "🇬🇷"],
    ["Aku cinta kamu.", "Indonesian", "🇮🇩"]
  ];

  // Change these messages to personalise your website.
  const CONFIG = {
    secretMessage:
      "Out of all the little things life could bring, some people end up meaning more than they will ever know. Maybe you are one of those people. ♡",
    rotationSpeed: 4000,
    particles: 65
  };

  const phraseEl = $("#phrase");
  const translationEl = $("#translation");
  const countEl = $("#languageCount");
  const progressEl = $("#progress");
  const nextBtn = $("#nextBtn");
  const heartBtn = $("#heartBtn");
  const soundBtn = $("#soundBtn");
  const soundIcon = $("#soundIcon");
  const modal = $("#letterModal");
  const letterBtn = $("#letterBtn");
  const modalClose = $("#modalClose");
  const modalBackdrop = $("#modalBackdrop");
  const modalMessage = $("#modalMessage");
  const replayBtn = $("#replayBtn");
  const canvas = $("#particles");
  const ctx = canvas.getContext("2d");

  let current = 0;
  let paused = false;
  let soundEnabled = false;
  let rotationTimer = null;
  let progressFrame = null;
  let progressStart = 0;
  let progressElapsed = 0;
  let audioContext = null;
  let toastTimer = null;
  let lastFocus = null;
  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrame = null;
  let lastFrame = 0;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  modalMessage.textContent = CONFIG.secretMessage;

  // Soft pink particles on the background canvas.
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const amount = Math.min(
      CONFIG.particles,
      Math.max(18, Math.round((width * height) / 17000))
    );

    particles = Array.from({ length: amount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.35,
      speed: Math.random() * 0.23 + 0.07,
      drift: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.55 + 0.12,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function drawParticles(timestamp = 0) {
    if (document.hidden) {
      animationFrame = null;
      return;
    }

    const delta = lastFrame
      ? Math.min((timestamp - lastFrame) / 16.67, 2)
      : 1;

    lastFrame = timestamp;
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      if (!reducedMotion) {
        p.y -= p.speed * delta;
        p.x += p.drift * delta;
        p.phase += 0.012 * delta;
      }

      if (p.y < -5) {
        p.y = height + 5;
        p.x = Math.random() * width;
      }

      if (p.x < -5) p.x = width + 5;
      if (p.x > width + 5) p.x = -5;

      const shimmer = reducedMotion
        ? 1
        : 0.65 + Math.sin(p.phase) * 0.35;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 135, 186, ${p.alpha * shimmer})`;
      ctx.fill();
    }

    animationFrame = requestAnimationFrame(drawParticles);
  }

  // Language rotation and progress bar.
  function updatePhrase(index) {
    current = (index + phrases.length) % phrases.length;
    const [text, language, flag] = phrases[current];

    phraseEl.textContent = text;
    translationEl.textContent = `${language} · ${flag}`;
    countEl.textContent =
      `${String(current + 1).padStart(2, "0")} / ${phrases.length}`;

    phraseEl.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: reducedMotion ? 1 : 400, easing: "ease-out" }
    );

    progressElapsed = 0;
    progressStart = performance.now();
    progressEl.style.width = "0%";
  }

  function stopRotation() {
    clearTimeout(rotationTimer);
    cancelAnimationFrame(progressFrame);
    rotationTimer = null;
    progressFrame = null;
  }

  function updateProgress(now) {
    if (paused || document.hidden) return;

    const elapsed = progressElapsed + (now - progressStart);
    const percent = Math.min((elapsed / CONFIG.rotationSpeed) * 100, 100);

    progressEl.style.width = `${percent}%`;

    if (percent >= 100) {
      progressFrame = null;
      updatePhrase(current + 1);
      scheduleNext();
      return;
    }

    progressFrame = requestAnimationFrame(updateProgress);
  }

  function scheduleNext() {
    stopRotation();

    if (paused || document.hidden) return;

    progressStart = performance.now();
    progressFrame = requestAnimationFrame(updateProgress);
  }

  function nextPhrase() {
    updatePhrase(current + 1);
    playChime();
    scheduleNext();
  }

  function togglePause() {
    paused = !paused;

    if (paused) {
      if (progressFrame !== null) {
        progressElapsed += performance.now() - progressStart;
      }

      stopRotation();
      progressEl.style.width =
        `${Math.min(progressElapsed / CONFIG.rotationSpeed * 100, 100)}%`;
      showToast("Take your time. ♡");
    } else {
      scheduleNext();
      showToast("Let the love keep flowing. ♡");
    }
  }

  // A tiny optional synthesized chime; no audio file needed.
  function playChime() {
    if (!soundEnabled) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") audioContext.resume();

      const now = audioContext.currentTime;

      [523.25, 659.25].forEach((frequency, i) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const start = now + i * 0.12;

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.045, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.34);
      });
    } catch (error) {
      console.warn("Optional sound is unavailable.", error);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? "♫" : "♪";

    soundBtn.setAttribute(
      "aria-label",
      soundEnabled ? "Turn sound off" : "Turn sound on"
    );

    soundBtn.style.background = soundEnabled ? "#ff4f9620" : "";
    soundBtn.style.borderColor = soundEnabled ? "#ff72a566" : "";

    if (soundEnabled) playChime();

    showToast(
      soundEnabled
        ? "Soft chimes enabled. ♡"
        : "Sound turned off."
    );
  }

  // Interactive heart burst.
  function heartBurst() {
    const universe = $("#heartUniverse");
    const heartRect = heartBtn.getBoundingClientRect();
    const universeRect = universe.getBoundingClientRect();

    const originX = heartRect.left + heartRect.width / 2 - universeRect.left;
    const originY = heartRect.top + heartRect.height / 2 - universeRect.top;
    const symbols = ["♥", "♡", "✦", "✧"];

    for (let i = 0; i < 16; i++) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 16;
      const distance = 45 + Math.random() * 65;

      particle.textContent = symbols[i % symbols.length];
      particle.setAttribute("aria-hidden", "true");

      Object.assign(particle.style, {
        position: "absolute",
        left: `${originX}px`,
        top: `${originY}px`,
        zIndex: "5",
        pointerEvents: "none",
        color: i % 2 ? "#ffafd0" : "#ff4f96",
        fontSize: `${10 + Math.random() * 10}px`
      });

      universe.appendChild(particle);

      const animation = particle.animate(
        [
          {
            transform: "translate(-50%, -50%) scale(.3) rotate(0deg)",
            opacity: 0.95
          },
          {
            transform:
              `translate(calc(-50% + ${Math.cos(angle) * distance}px), ` +
              `calc(-50% + ${Math.sin(angle) * distance}px)) ` +
              `scale(1.1) rotate(${Math.random() * 80 - 40}deg)`,
            opacity: 0
          }
        ],
        {
          duration: reducedMotion ? 1 : 650 + Math.random() * 350,
          easing: "cubic-bezier(.16,.7,.3,1)"
        }
      );

      animation.onfinish = () => particle.remove();
    }

    heartBtn.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.15)" },
        { transform: "scale(1)" }
      ],
      { duration: reducedMotion ? 1 : 350 }
    );

    playChime();
  }

  // Secret letter dialog.
  function openModal() {
    lastFocus = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  function replayExperience() {
    paused = false;
    updatePhrase(0);
    scheduleNext();

    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth"
    });

    showToast("Back to the beginning. ♡");
  }

  nextBtn.addEventListener("click", nextPhrase);
  heartBtn.addEventListener("click", heartBurst);
  soundBtn.addEventListener("click", toggleSound);
  letterBtn.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);
  replayBtn.addEventListener("click", replayExperience);

  // Escape closes the dialog; Space on the page toggles phrase rotation.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }

    if (
      event.code === "Space" &&
      !modal.classList.contains("open") &&
      !["BUTTON", "INPUT", "TEXTAREA", "A"].includes(
        document.activeElement.tagName
      )
    ) {
      event.preventDefault();
      togglePause();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (progressFrame !== null) {
        progressElapsed += performance.now() - progressStart;
      }
      stopRotation();
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
      lastFrame = 0;
    } else {
      if (!paused) scheduleNext();
      animationFrame = requestAnimationFrame(drawParticles);
    }
  });

  window.addEventListener("resize", resizeCanvas, { passive: true });

  // Start everything.
  resizeCanvas();
  updatePhrase(0);

  if (!document.hidden) {
    animationFrame = requestAnimationFrame(drawParticles);
    scheduleNext();
  }
})();
