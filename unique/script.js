
const phrases = [
  { text: "I love you", language: "English", flag: "🇬🇧" },
  { text: "Je t’aime", language: "French", flag: "🇫🇷" },
  { text: "Te amo", language: "Spanish", flag: "🇪🇸" },
  { text: "Ich liebe dich", language: "German", flag: "🇩🇪" },
  { text: "Ti amo", language: "Italian", flag: "🇮🇹" },
  { text: "愛してる", language: "Japanese", flag: "🇯🇵" },
  { text: "사랑해", language: "Korean", flag: "🇰🇷" },
  { text: "我爱你", language: "Chinese", flag: "🇨🇳" },
  { text: "मैं तुमसे प्यार करता हूँ", language: "Hindi", flag: "🇮🇳" },
  { text: "میں تم سے محبت کرتا ہوں", language: "Urdu", flag: "🇵🇰" },
  { text: "أحبك", language: "Arabic", flag: "🌙" },
  { text: "Я тебя люблю", language: "Russian", flag: "🇷🇺" },
  { text: "Ik hou van jou", language: "Dutch", flag: "🇳🇱" },
  { text: "Jag älskar dig", language: "Swedish", flag: "🇸🇪" },
  { text: "Jeg elsker deg", language: "Norwegian", flag: "🇳🇴" },
  { text: "Seni seviyorum", language: "Turkish", flag: "🇹🇷" },
  { text: "Kocham cię", language: "Polish", flag: "🇵🇱" },
  { text: "Eu te amo", language: "Portuguese", flag: "🇵🇹" },
  { text: "Σ' αγαπώ", language: "Greek", flag: "🇬🇷" },
  { text: "Aku cinta kamu", language: "Indonesian", flag: "🇮🇩" }
];

const phraseElement = document.getElementById("phrase");
const translationElement = document.getElementById("translation");
const progressElement = document.getElementById("progress");
const nextButton = document.getElementById("nextBtn");
const pauseButton = document.getElementById("pauseBtn");
const particleContainer = document.getElementById("heartParticles");

let currentIndex = 0;
let paused = false;
let timer = null;
let progressTimer = null;
let progress = 0;

const DISPLAY_DURATION = 3500;
const PROGRESS_STEP = 50;

function showPhrase(index) {
  currentIndex = (index + phrases.length) % phrases.length;
  const item = phrases[currentIndex];

  phraseElement.textContent = item.text;
  translationElement.textContent = `${item.language} · ${item.flag}`;

  phraseElement.animate(
    [
      { opacity: 0, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 450, easing: "ease-out" }
  );

  resetProgress();
}

function resetProgress() {
  clearInterval(progressTimer);
  progress = 0;
  progressElement.style.width = "0%";

  if (paused) return;

  progressTimer = setInterval(() => {
    progress += (PROGRESS_STEP / DISPLAY_DURATION) * 100;
    progressElement.style.width = `${Math.min(progress, 100)}%`;

    if (progress >= 100) {
      clearInterval(progressTimer);
    }
  }, PROGRESS_STEP);
}

function nextPhrase() {
  showPhrase(currentIndex + 1);
}

function startAutoRotation() {
  clearInterval(timer);
  timer = setInterval(() => {
    if (!paused) nextPhrase();
  }, DISPLAY_DURATION);
}

function togglePause() {
  paused = !paused;

  if (paused) {
    clearInterval(progressTimer);
    pauseButton.textContent = "Resume animation";
    progressElement.style.width = `${progress}%`;
  } else {
    pauseButton.textContent = "Pause animation";
    resetProgress();
  }

  const heart = document.querySelector(".heart");
  heart.style.animationPlayState = paused ? "paused" : "running";

  document.querySelectorAll(".particle").forEach((particle) => {
    particle.style.animationPlayState = paused ? "paused" : "running";
  });
}

function createParticles() {
  const symbols = ["♡", "♥", "✦", "·"];

  for (let i = 0; i < 18; i++) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.textContent = symbols[i % symbols.length];

    const angle = (i / 18) * Math.PI * 2;
    const radius = 65 + Math.random() * 60;

    particle.style.setProperty("--dx", `${Math.cos(angle) * radius}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle) * radius - 30}px`);
    particle.style.animationDelay = `${Math.random() * 3.5}s`;
    particle.style.animationDuration = `${2.5 + Math.random() * 2}s`;

    particleContainer.appendChild(particle);
  }
}

nextButton.addEventListener("click", nextPhrase);
pauseButton.addEventListener("click", togglePause);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInterval(timer);
    clearInterval(progressTimer);
  } else {
    if (!paused) {
      startAutoRotation();
      resetProgress();
    }
  }
});

showPhrase(0);
createParticles();
startAutoRotation();
