// Minimal: Theme Toggle + Platzhalter-Navigation
const root = document.documentElement;
const btnTheme = document.getElementById("btn-theme");
const statusEl = document.getElementById("status");

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

function getTheme() {
  // Standard: light
  return localStorage.getItem("theme") || "light";
}

// Init Theme (persistiert über Seiten)
setTheme(getTheme());
statusEl.textContent = `Theme: ${root.dataset.theme}`;

btnTheme.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  setTheme(next);
  statusEl.textContent = `Theme: ${next}`;
});

// Buttons
document.getElementById("btn-training").addEventListener("click", () => {
  statusEl.textContent = "Training: (coming next) – wir bauen als nächstes den Ablauf";
  // window.location.href = "training.html";
});

document.getElementById("btn-practice").addEventListener("click", () => {
  window.location.href = "practice.html";
});

document.getElementById("btn-about").addEventListener("click", () => {
  statusEl.textContent = "Über/Infos: (coming next) – z.B. Methodik, Datenschutz, Credits";
  // window.location.href = "about.html";
});
