(function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || "light";
  document.documentElement.dataset.theme = theme;
})();

const imgEl = document.getElementById("faceImg");
const badgeEl = document.getElementById("feedbackBadge");
const resultTextEl = document.getElementById("resultText");

const scoreEl = document.getElementById("score");
const accuracyEl = document.getElementById("accuracy");
const totalEl = document.getElementById("total");

const btnReal = document.getElementById("btnReal");
const btnFake = document.getElementById("btnFake");
const btnNext = document.getElementById("btnNext");

let pool = [];
let current = null;
let score = 0;
let total = 0;
let answered = false;

function setButtons(enabled){
  btnReal.disabled = !enabled;
  btnFake.disabled = !enabled;
}

function updateStats(){
  scoreEl.textContent = score;
  totalEl.textContent = total;
  accuracyEl.textContent = total ? Math.round(score/total*100)+"%" : "0%";
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function resetFeedback(){
  badgeEl.textContent="";
  badgeEl.className="badge";
  resultTextEl.textContent="";
}

function pickNext(){
  resetFeedback();
  answered=false;
  btnNext.disabled=true;
  setButtons(false);

  current = pool[Math.floor(Math.random()*pool.length)];
  imgEl.src=current.src;

  imgEl.onload=()=>setButtons(true);
}

function answer(label){
  if(answered) return;
  answered=true;

  setButtons(false);

  const correct=current.label===label;
  total++;
  if(correct) score++;

  updateStats();

  badgeEl.textContent = correct ? "✓" : "✕";
  badgeEl.className = "badge " + (correct ? "ok" : "bad");

  resultTextEl.textContent =
    "Das Bild war: " + (current.label==="real" ? "Echt" : "KI");

  btnNext.disabled=false;
}

btnReal.onclick=()=>answer("real");
btnFake.onclick=()=>answer("fake");
btnNext.onclick=()=>pickNext();

async function init(){
  const res = await fetch(`data/images.json?v=${Date.now()}`, {cache:"no-store"});
  const data = await res.json();

  const real = (data.real||[]).map(s=>({src:s,label:"real"}));
  const fake = (data.fake||[]).map(s=>({src:s,label:"fake"}));

  pool = shuffle([...real,...fake]);
  updateStats();
  pickNext();
}

init();
