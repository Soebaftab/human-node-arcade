(() => {
"use strict";

/* =========================================================
   SUPABASE CONNECTION
   ========================================================= */

const SUPABASE_URL = "https://ublxsiswduunfvjqyshq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_UqemFgP_47BbetLvYdBkJg_e5qA2ckp";


const remoteEnabled =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_YOUR_") &&
  SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_");


const supabase =
  remoteEnabled && window.supabase
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      )
    : null;


/* =========================================================
   GAME ELEMENTS
   ========================================================= */

const arena = document.getElementById("arena");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const chainEl = document.getElementById("chain");
const timeEl = document.getElementById("time");
const timeBar = document.getElementById("timeBar");
const message = document.getElementById("message");

const start = document.getElementById("start");
const reset = document.getElementById("reset");

const result = document.getElementById("result");
const finalScore = document.getElementById("finalScore");
const finalText = document.getElementById("finalText");
const finalHits = document.getElementById("finalHits");
const finalNoise = document.getElementById("finalNoise");
const finalPrecision = document.getElementById("finalPrecision");
const again = document.getElementById("again");

const callsign = document.getElementById("callsign");
const country = document.getElementById("country");
const saveScore = document.getElementById("saveScore");

const leaderboardList =
  document.getElementById("leaderboardList");

const clearBoard =
  document.getElementById("clearBoard");

const leaderboardStatus =
  document.getElementById("leaderboardStatus");


/* =========================================================
   GAME STATE
   ========================================================= */

const BOARD_KEY =
  "human-node-arcade-board-v1";

let score = 0;
let chain = 0;
let time = 30;
let running = false;

let timer = null;
let spawnTimer = null;

let hits = 0;
let noiseHits = 0;


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function board() {
  try {
    return JSON.parse(
      localStorage.getItem(BOARD_KEY) || "[]"
    );
  } catch {
    return [];
  }
}


function setBoard(rows) {
  localStorage.setItem(
    BOARD_KEY,
    JSON.stringify(rows)
  );
}


function best() {
  return board().reduce(
    (max, row) =>
      Math.max(max, Number(row.score) || 0),
    0
  );
}


/* =========================================================
   UI
   ========================================================= */

function update() {

  scoreEl.textContent = score;
  bestEl.textContent = best();
  chainEl.textContent = chain;
  timeEl.textContent = time;

  timeBar.style.width =
    (time / 30 * 100) + "%";
}


function say(text, type = "") {

  message.textContent = text;
  message.className =
    "message " + type;
}


function clearNodes() {

  arena
    .querySelectorAll(".node")
    .forEach(node => node.remove());
}


/* =========================================================
   GAME NODE
   ========================================================= */

function tap(node) {

  if (
    !running ||
    !node.isConnected
  ) return;


  if (node.dataset.human === "1") {

    node.classList.add("hit");

    hits++;
    chain++;

    const multiplier =
      1 +
      Math.min(
        4,
        Math.floor(chain / 5) * 0.25
      );

    score +=
      Math.round(10 * multiplier);

    update();

    say(
      chain >= 5
        ? `Signal locked · ${multiplier.toFixed(2)}× chain bonus.`
        : "Human signal confirmed.",
      chain >= 5
        ? "combo"
        : "good"
    );

    setTimeout(
      () => node.remove(),
      130
    );

  } else {

    node.classList.add("miss");

    noiseHits++;

    chain = 0;

    score =
      Math.max(
        0,
        score - 12
      );

    update();

    say(
      "Noise detected. Chain broken.",
      "bad"
    );

    setTimeout(
      () => node.remove(),
      130
    );
  }
}


/* =========================================================
   SPAWN NODES
   ========================================================= */

function spawn() {

  if (!running) return;

  const elapsed =
    30 - time;

  const count =
    Math.min(
      10,
      3 + Math.floor(elapsed / 6)
    );

  const humanCount =
    1 +
    Math.floor(
      Math.random() *
      Math.min(3, count)
    );

  const spots = [];


  for (
    let i = 0;
    i < count;
    i++
  ) {

    let x;
    let y;
    let tries = 0;


    do {

      x =
        7 +
        Math.random() * 86;

      y =
        8 +
        Math.random() * 80;

      tries++;

    } while (
      tries < 20 &&
      spots.some(
        point =>
          Math.hypot(
            point.x - x,
            point.y - y
          ) < 11
      )
    );


    spots.push({ x, y });


    const node =
      document.createElement("button");

    node.type = "button";

    node.className =
      "node " +
      (
        i < humanCount
          ? "human"
          : "noise"
      );


    node.style.left =
      x + "%";

    node.style.top =
      y + "%";


    node.setAttribute(
      "aria-label",
      i < humanCount
        ? "Human signal"
        : "Noise signal"
    );


    const dot =
      document.createElement("span");

    dot.className = "dot";

    node.appendChild(dot);


    node.dataset.human =
      i < humanCount
        ? "1"
        : "0";


    node.addEventListener(
      "click",
      () => tap(node)
    );


    arena.appendChild(node);


    const lifetime =
      Math.max(
        700,
        2100 -
        elapsed * 25 +
        Math.random() * 500
      );


    setTimeout(() => {

      if (!node.isConnected)
        return;

      node.classList.add("miss");

      setTimeout(
        () => node.remove(),
        140
      );


      if (
        node.dataset.human === "1" &&
        running
      ) {

        chain = 0;

        update();

        say(
          "Signal lost — find the next human node.",
          "bad"
        );
      }

    }, lifetime);
  }
}


/* =========================================================
   END GAME
   ========================================================= */

function end() {

  running = false;

  clearInterval(timer);
  clearInterval(spawnTimer);

  clearNodes();

  start.textContent =
    "Start Network";


  finalScore.textContent =
    score;

  finalHits.textContent =
    hits;

  finalNoise.textContent =
    noiseHits;


  finalPrecision.textContent =
    (
      hits + noiseHits
        ? Math.round(
            hits /
            (hits + noiseHits) *
            100
          )
        : 0
    ) + "%";


  finalText.textContent =
    score >= 300
      ? "High-density signal run."
      : score >= 150
        ? "A strong network connection."
        : "Keep training your signal detection.";


  result.hidden = false;

  say(
    "Round complete.",
    "good"
  );

  update();

  callsign.focus();
}


/* =========================================================
   START
   ========================================================= */

function begin() {

  clearInterval(timer);
  clearInterval(spawnTimer);

  clearNodes();

  score = 0;
  chain = 0;
  time = 30;

  hits = 0;
  noiseHits = 0;

  running = true;

  result.hidden = true;

  start.textContent =
    "Restart";

  update();

  say(
    "Find the Human Signals."
  );

  spawn();

  spawnTimer =
    setInterval(
      spawn,
      1650
    );


  timer =
    setInterval(() => {

      time--;

      update();

      if (time <= 0) {
        end();
      }

    }, 1000);
}


/* =========================================================
   RESET
   ========================================================= */

function resetGame() {

  running = false;

  clearInterval(timer);
  clearInterval(spawnTimer);

  clearNodes();

  score = 0;
  chain = 0;
  time = 30;

  hits = 0;
  noiseHits = 0;

  result.hidden = true;

  start.textContent =
    "Start Network";

  update();

  say(
    "Press Start Network to begin."
  );
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

  return String(value).replace(
    /[&<>'"]/g,
    character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      }[character])
  );
}


/* =========================================================
   LOCAL LEADERBOARD
   ========================================================= */

function renderLocalBoard() {

  const rows =
    board()
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.ts - b.ts
      )
      .slice(0, 10);


  if (!rows.length) {

    leaderboardList.innerHTML =
      '<div class="empty-board">No local scores yet.</div>';

    return;
  }


  leaderboardList.innerHTML =
    rows
      .map(
        (row, index) =>
          `<div class="board-row">
            <span class="rank">#${index + 1}</span>
            <span class="board-name">
              ${row.country || "🌐"}
              ${escapeHtml(row.name)}
            </span>
            <span class="board-date">
              ${new Date(row.ts).toLocaleDateString()}
            </span>
            <span class="board-score">
              ${row.score}
            </span>
          </div>`
      )
      .join("");
}


/* =========================================================
   WORLDWIDE LEADERBOARD
   ========================================================= */

async function renderRemoteBoard() {

  if (!supabase) {

    leaderboardStatus.textContent =
      "Worldwide board is not connected yet.";

    renderLocalBoard();

    return;
  }


  leaderboardStatus.textContent =
    "Loading worldwide scores…";


  const {
    data,
    error
  } =
