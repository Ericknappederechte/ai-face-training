(function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || "light";
  document.documentElement.dataset.theme = theme;
})();

const TOTAL_ROUNDS = 30;

const imgEl = document.getElementById("faceImg");
const badgeEl = document.getElementById("feedbackBadge");
const resultTextEl = document.getElementById("resultText");

const scoreEl = document.getElementById("score");
const totalEl = document.getElementById("total");
const progressEl = document.getElementById("progress");

const btnReal = document.getElementById("btnReal");
const btnFake = document.getElementById("btnFake");
const btnNext = document.getElementById("btnNext");

let pool = [];
let sessionPool = [];
let current = null;

let score = 0;
let total = 0;
let round = 0;
let answered = false;

let results = [];

function setAnswerButtonsEnabled(enabled) {
  btnReal.disabled = !enabled;
  btnFake.disabled = !enabled;
}

function updateStats() {
  scoreEl.textContent = score;
  totalEl.textContent = total;
  progressEl.textContent = `${round}/${TOTAL_ROUNDS}`;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resetFeedback() {
  badgeEl.textContent = "";
  badgeEl.className = "badge";
  resultTextEl.textContent = "";
}

function pickNext() {
  if (round >= TOTAL_ROUNDS) {
    finishPretest();
    return;
  }

  resetFeedback();
  answered = false;
  btnNext.disabled = true;
  setAnswerButtonsEnabled(false);

  current = sessionPool[round];
  round++;

  updateStats();

  imgEl.src = current.src;
  imgEl.onload = () => setAnswerButtonsEnabled(true);
}

function answer(label) {
  if (!current || answered) return;
  answered = true;

  setAnswerButtonsEnabled(false);

  const correct = current.label === label;
  total++;
  if (correct) score++;

  results.push({
    file: current.src.split("/").pop(),
    correct,
    actual: current.label,
    chosen: label
  });

  badgeEl.textContent = correct ? "✓" : "✕";
  badgeEl.classList.add(correct ? "ok" : "bad");

  resultTextEl.textContent =
    "Das Bild war: " + (current.label === "real" ? "Echt" : "KI");

  updateStats();
  btnNext.disabled = false;
}

function finishPretest() {
  let correctList = results.filter(r => r.correct).map(r => r.file);
  let wrongList = results.filter(r => !r.correct).map(r => r.file);

  alert(
`Pretest abgeschlossen

Richtig: ${score} / ${TOTAL_ROUNDS}

Richtig erkannt:
${correctList.join("\n")}

Falsch erkannt:
${wrongList.join("\n")}`
  );
}

btnReal.onclick = () => answer("real");
btnFake.onclick = () => answer("fake");
btnNext.onclick = () => pickNext();

async function init() {
  const res = await fetch(`data/images.json?v=${Date.now()}`, { cache: "no-store" });
  const data = await res.json();

  const real = (data.real || []).map(src => ({ src, label: "real" }));
  const fake = (data.fake || []).map(src => ({ src, label: "fake" }));

  pool = shuffle([...real, ...fake]);

  sessionPool = pool.slice(0, TOTAL_ROUNDS);

  round = 0;
  updateStats();
  pickNext();
}

init();
