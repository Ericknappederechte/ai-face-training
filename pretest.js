(function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || "light";
  document.documentElement.dataset.theme = theme;
})();

const TOTAL_ROUNDS = 30;

// ===== DOM =====
const imgEl = document.getElementById("faceImg");
const badgeEl = document.getElementById("feedbackBadge");
const resultTextEl = document.getElementById("resultText");

const scoreEl = document.getElementById("score");
const totalEl = document.getElementById("total");
const progressEl = document.getElementById("progress");

const btnReal = document.getElementById("btnReal");
const btnFake = document.getElementById("btnFake");
const btnNext = document.getElementById("btnNext");

// Modal-Elemente
const modalEl = document.getElementById("resultModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnRestartPretest = document.getElementById("btnRestartPretest");
const resultSubtitle = document.getElementById("resultSubtitle");
const resultSummary = document.getElementById("resultSummary");
const correctWrap = document.getElementById("correctWrap");
const wrongWrap = document.getElementById("wrongWrap");

// ===== State =====
let pool = [];        // gesamter Pool
let sessionPool = []; // genau 30 Bilder (die im Pretest laufen)
let current = null;   // aktuelles Item

let score = 0;
let totalAnswered = 0;    // wie viele Antworten abgegeben
let roundIndex = 0;       // 0..29 -> welches Bild wird gerade gezeigt
let answered = false;

let results = []; // { filename, correctLabel, userLabel, isCorrect }

// ===== Helpers =====
function setAnswerButtonsEnabled(enabled) {
  btnReal.disabled = !enabled;
  btnFake.disabled = !enabled;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function filenameFromSrc(src) {
  const clean = String(src || "").split("?")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] || clean;
}

function labelPretty(label) {
  if (label === "real") return "Echt";
  if (label === "fake") return "KI";
  return String(label);
}

function tagClass(label) {
  // CSS hat bei dir: .tag.real und .tag.fake
  // daher: real/fake zurückgeben – alles andere neutral
  return label === "real" ? "real" : label === "fake" ? "fake" : "";
}

function resetFeedback() {
  badgeEl.textContent = "";
  badgeEl.className = "badge";
  if (resultTextEl) resultTextEl.textContent = "";
}

function updateStats() {
  scoreEl.textContent = String(score);
  totalEl.textContent = String(totalAnswered);
  // progress = aktuelles Bild (1..30). roundIndex zeigt das aktuelle, also +1
  progressEl.textContent = `${Math.min(roundIndex + 1, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}`;
}

function openModal() {
  if (!modalEl) return;
  modalEl.classList.add("open");
  modalEl.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove("open");
  modalEl.setAttribute("aria-hidden", "true");
}

function makeTable(rows) {
  if (!rows.length) {
    return `<div style="padding:12px 14px; color: var(--muted);">Keine Einträge.</div>`;
  }

  return `
    <table class="result-table">
      <thead>
        <tr>
          <th>Datei</th>
          <th>Deine Antwort</th>
          <th>Korrekt</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((r) => {
            const userCls = tagClass(r.userLabel);
            const corrCls = tagClass(r.correctLabel);

            return `
              <tr>
                <td class="filecell">${r.filename}</td>
                <td><span class="tag ${userCls}">${labelPretty(r.userLabel)}</span></td>
                <td><span class="tag ${corrCls}">${labelPretty(r.correctLabel)}</span></td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

// ===== Core =====
function showCurrentImage() {
  if (roundIndex >= TOTAL_ROUNDS) {
    finishPretest();
    return;
  }

  resetFeedback();
  answered = false;
  btnNext.disabled = true;
  setAnswerButtonsEnabled(false);

  current = sessionPool[roundIndex];
  updateStats();

  imgEl.src = current.src;

  imgEl.onload = () => {
    setAnswerButtonsEnabled(true);
  };

  imgEl.onerror = () => {
    console.warn("Image failed to load:", current?.src);

    // Ersatz aus pool, der noch NICHT in sessionPool ist
    const used = new Set(sessionPool.map((x) => x.src));
    const candidates = pool.filter((x) => !used.has(x.src));

    if (candidates.length) {
      const replacement = candidates[Math.floor(Math.random() * candidates.length)];
      sessionPool[roundIndex] = replacement;
      current = replacement;
      showCurrentImage();
      return;
    }

    // Wenn kein Ersatz da ist: überspringe diese Runde (ohne Antwort zu zählen)
    // Wir gehen einfach zum nächsten Bild.
    roundIndex++;
    showCurrentImage();
  };
}

function answer(userLabel) {
  if (!current || answered) return;
  answered = true;

  setAnswerButtonsEnabled(false);

  const correctLabel = current.label; // real|fake
  const isCorrect = correctLabel === userLabel;

  totalAnswered++;
  if (isCorrect) score++;

  results.push({
    filename: filenameFromSrc(current.src),
    correctLabel,
    userLabel,
    isCorrect,
  });

  badgeEl.textContent = isCorrect ? "✓" : "✕";
  badgeEl.classList.toggle("ok", isCorrect);
  badgeEl.classList.toggle("bad", !isCorrect);

  if (resultTextEl) {
    resultTextEl.textContent = "Das Bild war: " + labelPretty(correctLabel);
  }

  updateStats();
  btnNext.disabled = false;
}

function nextRound() {
  if (!answered) return; // Sicherheitsnetz
  roundIndex++;
  showCurrentImage();
}

function finishPretest() {
  // Buttons deaktivieren
  btnReal.disabled = true;
  btnFake.disabled = true;
  btnNext.disabled = true;

  // Modal muss existieren – sonst fallback (aber du willst modal)
  if (!modalEl || !resultSubtitle || !resultSummary || !correctWrap || !wrongWrap) {
    alert(`Pretest abgeschlossen\n\nRichtig: ${score} / ${TOTAL_ROUNDS}`);
    return;
  }

  const correct = results.filter((r) => r.isCorrect);
  const wrong = results.filter((r) => !r.isCorrect);
  const acc = Math.round((correct.length / TOTAL_ROUNDS) * 100);

  resultSubtitle.textContent = `Ergebnis: ${correct.length}/${TOTAL_ROUNDS} richtig (${acc}%).`;

  resultSummary.innerHTML = `
    <div class="pill ok">✅ Richtig: ${correct.length}</div>
    <div class="pill bad">❌ Falsch: ${wrong.length}</div>
    <div class="pill">📌 Insgesamt: ${TOTAL_ROUNDS}</div>
  `;

  // Sortierung der falschen: z.B. real->fake, fake->real gruppiert
  const wrongSorted = [...wrong].sort((a, b) => {
    const aKey = `${a.correctLabel}->${a.userLabel}::${a.filename}`;
    const bKey = `${b.correctLabel}->${b.userLabel}::${b.filename}`;
    return aKey.localeCompare(bKey);
  });

  // Richtig nach Dateiname sortieren
  const correctSorted = [...correct].sort((a, b) => a.filename.localeCompare(b.filename));

  correctWrap.innerHTML = makeTable(correctSorted);
  wrongWrap.innerHTML = makeTable(wrongSorted);

  openModal();
}

// ===== Events =====
btnReal.addEventListener("click", () => answer("real"));
btnFake.addEventListener("click", () => answer("fake"));
btnNext.addEventListener("click", nextRound);

btnCloseModal?.addEventListener("click", closeModal);
modalEl?.addEventListener("click", (e) => {
  if (e.target === modalEl) closeModal();
});
btnRestartPretest?.addEventListener("click", () => window.location.reload());

// ===== Init =====
async function init() {
  score = 0;
  totalAnswered = 0;
  roundIndex = 0;
  answered = false;
  results = [];

  setAnswerButtonsEnabled(false);
  btnNext.disabled = true;

  const res = await fetch(`data/images.json?v=${Date.now()}`, { cache: "no-store" });
  const data = await res.json();

  const real = (data.real || []).map((src) => ({ src, label: "real" }));
  const fake = (data.fake || []).map((src) => ({ src, label: "fake" }));

  pool = shuffle([...real, ...fake]);

  // genau 30 Bilder
  sessionPool = pool.slice(0, TOTAL_ROUNDS);

  updateStats();
  showCurrentImage();
}

init();
