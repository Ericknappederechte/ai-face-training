// Theme: Standard = light, über alle Seiten hinweg
(function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || "light";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
})();

// Safe-Helper, damit nichts crasht wenn IDs mal fehlen
function onClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", fn);
}

// Navigation
onClick("btn-pretest", () => {
  // Pretest-Seite (bauen wir als nächstes)
  window.location.href = "pretest.html";
});

onClick("btn-practice", () => {
  window.location.href = "practice.html";
});

onClick("btn-info", () => {
  window.location.href = "info.html";
});
