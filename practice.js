// Theme beim direkten Öffnen von practice.html übernehmen (Standard: light)
(function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || "light";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
})();

const imgEl = document.getElementById("faceImg");
const feedbackEl = document.getElementById("feedback"); // bleibt im DOM, wird aber nicht genutzt
const badgeEl = document.getElementById("feedbackBadge");

const scoreEl = document.getElementById("score");
const accuracyEl = document.getElementById("accuracy");
const totalEl = document.getElementById("total");

const btnReal = document.getElementById("btnReal");
const btnFake = document.getElementById("btnFake");
const btnNext = document.getElementById("btnNext");

let pool = []; // {src, label}
let current = null;

let score = 0;
let total = 0;
let answered = false;

function setAnswerButtonsEnabled(enabled) {
  btnReal.disabled = !enabled;
  btnFake.disabled = !enabled;
}

function updateStats() {
  scoreEl.textContent = String(score);
  totalEl.textContent = String(total);
  const acc = total === 0 ? 0 : Math.round((score / total) * 100);
  accuracyEl.textContent = `${acc}%`;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resetUIForNext() {
  // Badge reset
  badgeEl.textContent = "";
  badgeEl.className = "badge";

  // Kein Text-Feedback (wir setzen es bewusst immer leer)
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";

  answered = false;
  btnNext.disabled = true;
  setAnswerButtonsEnabled(false);
}

function pickNext() {
  resetUIForNext();

  if (!pool.length) {
    // Optionaler Hinweis — kannst du auch komplett entfernen
    feedbackEl.textContent =
      "Keine Bilder gefunden. Prüfe data/images.json und assets/images/Real & assets/images/Fake.";
    return;
  }

  current = pool[Math.floor(Math.random() * pool.length)];
  imgEl.src = current.src;

  imgEl.onload = () => {
    setAnswerButtonsEnabled(true);
  };

  imgEl.onerror = () => {
    // Bild entfernen und nächstes versuchen
    pool = pool.filter((x) => x.src !== current.src);
    pickNext();
  };
}

function answer(label) {
  if (!current || answered) return;
  answered = true;

  setAnswerButtonsEnabled(false);

  const correct = current.label === label;
  total++;
  if (correct) score++;

  updateStats();

  // Nur Badge anzeigen (kein Text)
  badgeEl.textContent = correct ? "✓" : "✕";
  badgeEl.classList.toggle("ok", correct);
  badgeEl.classList.toggle("bad", !correct);

  // Text bleibt leer
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";

  btnNext.disabled = false;
}

btnReal.addEventListener("click", () => answer("real"));
btnFake.addEventListener("click", () => answer("fake"));
btnNext.addEventListener("click", pickNext);

async function init() {
  updateStats();
  setAnswerButtonsEnabled(false);
  btnNext.disabled = true;

  try {
    // Cache-Buster + no-store, damit Änderungen an images.json sofort greifen
    const res = await fetch(`data/images.json?v=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();

    const real = (data.real || []).map((src) => ({ src, label: "real" }));
    const fake = (data.fake || []).map((src) => ({ src, label: "fake" }));

    pool = shuffle([...real, ...fake]);

    if (!pool.length) {
      feedbackEl.textContent =
        "images.json ist leer. Bitte erst die Dateiliste generieren (real/fake).";
      return;
    }

    pickNext();
  } catch (e) {
    feedbackEl.textContent =
      "Konnte data/images.json nicht laden. Starte die Seite über Live Server und prüfe Pfade.";
    console.error(e);
  }
}

init();
