const STORAGE_KEY = "nova-productivite-v1";
const state = {
  theme: "dark",
  focus: "",
  tasks: [],
  notes: [],
  habits: [],
  timer: {
    mode: "work",
    remaining: 25 * 60,
    workMinutes: 25,
    breakMinutes: 5,
    running: false,
    sessionsDone: 0,
    weeklySessions: {},
  },
};

const els = {
  body: document.body,
  themeToggle: document.getElementById("themeToggle"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),

  focusForm: document.getElementById("focusForm"),
  focusInput: document.getElementById("focusInput"),
  focusDisplay: document.getElementById("focusDisplay"),

  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskPriority: document.getElementById("taskPriority"),
  taskDue: document.getElementById("taskDue"),
  taskList: document.getElementById("taskList"),

  noteForm: document.getElementById("noteForm"),
  noteInput: document.getElementById("noteInput"),
  noteList: document.getElementById("noteList"),

  habitForm: document.getElementById("habitForm"),
  habitInput: document.getElementById("habitInput"),
  habitList: document.getElementById("habitList"),

  timerValue: document.getElementById("timerValue"),
  timerState: document.getElementById("timerState"),
  startTimer: document.getElementById("startTimer"),
  pauseTimer: document.getElementById("pauseTimer"),
  resetTimer: document.getElementById("resetTimer"),
  workMinutes: document.getElementById("workMinutes"),
  breakMinutes: document.getElementById("breakMinutes"),

  stats: document.getElementById("stats"),
  weeklyCanvas: document.getElementById("weeklyCanvas"),
};

let timerHandle = null;

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch {
    console.warn("Impossible de charger les données.");
  }
}

function setTheme(theme) {
  state.theme = theme;
  els.body.classList.toggle("light", theme === "light");
  els.themeToggle.textContent = theme === "light" ? "🌙 Thème" : "☀️ Thème";
}

function renderFocus() {
  els.focusDisplay.textContent = state.focus || "Aucun focus défini.";
}

function renderTasks() {
  els.taskList.innerHTML = "";
  const sorted = [...state.tasks].sort((a, b) => Number(a.done) - Number(b.done));
  for (const task of sorted) {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div>
        <div><strong>${escapeHtml(task.title)}</strong> <span class="badge ${task.priority}">${labelPriority(task.priority)}</span></div>
        <div class="meta">${task.done ? "Terminée" : "En cours"}${task.due ? ` • Échéance ${task.due}` : ""}</div>
      </div>
      <div class="actions">
        <button data-action="toggle" data-id="${task.id}">${task.done ? "↩" : "✓"}</button>
        <button data-action="delete" data-id="${task.id}">🗑</button>
      </div>`;
    els.taskList.appendChild(li);
  }
}

function renderNotes() {
  els.noteList.innerHTML = "";
  for (const note of [...state.notes].reverse()) {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div>
        <div>${escapeHtml(note.text)}</div>
        <div class="meta">${note.createdAt}</div>
      </div>
      <div class="actions">
        <button data-action="delete-note" data-id="${note.id}">🗑</button>
      </div>`;
    els.noteList.appendChild(li);
  }
}

function renderHabits() {
  const today = todayKey();
  els.habitList.innerHTML = "";
  for (const habit of state.habits) {
    const doneToday = habit.doneDates.includes(today);
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div>
        <div><strong>${escapeHtml(habit.title)}</strong></div>
        <div class="meta">Streak: ${habit.streak} jour(s)</div>
      </div>
      <div class="actions">
        <button data-action="toggle-habit" data-id="${habit.id}">${doneToday ? "Annuler" : "Valider"}</button>
        <button data-action="delete-habit" data-id="${habit.id}">🗑</button>
      </div>`;
    els.habitList.appendChild(li);
  }
}

function labelPriority(p) {
  return p === "high" ? "Haute" : p === "medium" ? "Moyenne" : "Basse";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTimer() {
  const minutes = Math.floor(state.timer.remaining / 60);
  const seconds = state.timer.remaining % 60;
  els.timerValue.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  els.timerState.textContent = `Mode: ${state.timer.mode === "work" ? "Travail" : "Pause"}`;
  els.workMinutes.value = state.timer.workMinutes;
  els.breakMinutes.value = state.timer.breakMinutes;
}

function stepTimer() {
  if (!state.timer.running) return;
  state.timer.remaining -= 1;
  if (state.timer.remaining <= 0) {
    if (state.timer.mode === "work") {
      state.timer.sessionsDone += 1;
      const key = todayKey();
      state.timer.weeklySessions[key] = (state.timer.weeklySessions[key] || 0) + 1;
    }
    state.timer.mode = state.timer.mode === "work" ? "break" : "work";
    state.timer.remaining = (state.timer.mode === "work" ? state.timer.workMinutes : state.timer.breakMinutes) * 60;
  }
  renderTimer();
  renderStats();
  save();
}

function startTimerLoop() {
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(stepTimer, 1000);
}

function resetTimerToMode() {
  state.timer.remaining = (state.timer.mode === "work" ? state.timer.workMinutes : state.timer.breakMinutes) * 60;
}

function getWeeklySeries() {
  const arr = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = todayKey(d);
    arr.push({
      label: k.slice(5),
      value: state.timer.weeklySessions[k] || 0,
    });
  }
  return arr;
}

function drawWeeklyChart() {
  const ctx = els.weeklyCanvas.getContext("2d");
  const w = els.weeklyCanvas.width;
  const h = els.weeklyCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const data = getWeeklySeries();
  const max = Math.max(1, ...data.map((d) => d.value));
  const pad = 25;
  const chartH = h - pad * 2;
  const barW = (w - pad * 2) / data.length - 14;

  data.forEach((d, i) => {
    const x = pad + i * (barW + 14);
    const barHeight = (d.value / max) * (chartH - 20);
    const y = h - pad - barHeight;
    ctx.fillStyle = "#4ea3ff";
    ctx.fillRect(x, y, barW, barHeight);
    ctx.fillStyle = "#93a7d8";
    ctx.fillText(d.label, x, h - 8);
    ctx.fillStyle = "#e8edff";
    ctx.fillText(String(d.value), x + barW / 3, y - 4);
  });
}

function renderStats() {
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter((t) => t.done).length;
  const habitDoneToday = state.habits.filter((h) => h.doneDates.includes(todayKey())).length;

  els.stats.innerHTML = [
    ["Tâches totales", totalTasks],
    ["Tâches complétées", doneTasks],
    ["Sessions Pomodoro", state.timer.sessionsDone],
    ["Habitudes faites (aujourd'hui)", habitDoneToday],
    ["Notes", state.notes.length],
  ]
    .map(
      ([label, value]) =>
        `<div class="stat"><div class="label">${label}</div><div class="value">${value}</div></div>`,
    )
    .join("");
  drawWeeklyChart();
}

function bindEvents() {
  els.themeToggle.addEventListener("click", () => {
    setTheme(state.theme === "light" ? "dark" : "light");
    save();
  });

  els.focusForm.addEventListener("submit", (e) => {
    e.preventDefault();
    state.focus = els.focusInput.value.trim();
    els.focusInput.value = "";
    renderFocus();
    save();
  });

  els.taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = els.taskTitle.value.trim();
    if (!title) return;
    state.tasks.push({
      id: uid(),
      title,
      priority: els.taskPriority.value,
      due: els.taskDue.value,
      done: false,
    });
    els.taskTitle.value = "";
    els.taskDue.value = "";
    renderTasks();
    renderStats();
    save();
  });

  els.taskList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === "toggle") {
      const t = state.tasks.find((task) => task.id === id);
      if (t) t.done = !t.done;
    }
    if (btn.dataset.action === "delete") {
      state.tasks = state.tasks.filter((task) => task.id !== id);
    }
    renderTasks();
    renderStats();
    save();
  });

  els.noteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = els.noteInput.value.trim();
    if (!text) return;
    state.notes.push({ id: uid(), text, createdAt: new Date().toLocaleString("fr-FR") });
    els.noteInput.value = "";
    renderNotes();
    renderStats();
    save();
  });

  els.noteList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.action === "delete-note") {
      state.notes = state.notes.filter((n) => n.id !== btn.dataset.id);
      renderNotes();
      renderStats();
      save();
    }
  });

  els.habitForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = els.habitInput.value.trim();
    if (!title) return;
    state.habits.push({ id: uid(), title, doneDates: [], streak: 0 });
    els.habitInput.value = "";
    renderHabits();
    renderStats();
    save();
  });

  els.habitList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    const habit = state.habits.find((h) => h.id === id);
    if (!habit) return;
    if (btn.dataset.action === "toggle-habit") {
      const tk = todayKey();
      const exists = habit.doneDates.includes(tk);
      if (exists) {
        habit.doneDates = habit.doneDates.filter((d) => d !== tk);
      } else {
        habit.doneDates.push(tk);
      }
      habit.streak = computeStreak(habit.doneDates);
    }
    if (btn.dataset.action === "delete-habit") {
      state.habits = state.habits.filter((h) => h.id !== id);
    }
    renderHabits();
    renderStats();
    save();
  });

  els.startTimer.addEventListener("click", () => {
    state.timer.running = true;
    save();
  });

  els.pauseTimer.addEventListener("click", () => {
    state.timer.running = false;
    save();
  });

  els.resetTimer.addEventListener("click", () => {
    state.timer.running = false;
    resetTimerToMode();
    renderTimer();
    save();
  });

  els.workMinutes.addEventListener("change", () => {
    state.timer.workMinutes = Math.max(1, Number(els.workMinutes.value || 25));
    if (state.timer.mode === "work") resetTimerToMode();
    renderTimer();
    save();
  });

  els.breakMinutes.addEventListener("change", () => {
    state.timer.breakMinutes = Math.max(1, Number(els.breakMinutes.value || 5));
    if (state.timer.mode === "break") resetTimerToMode();
    renderTimer();
    save();
  });

  els.exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nova-productivite-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  els.importInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (!data || typeof data !== "object") throw new Error("bad");
      Object.assign(state, data);
      initialize();
      save();
    } catch {
      alert("Fichier invalide");
    }
    e.target.value = "";
  });

  document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "t") els.taskTitle.focus();
    if (k === "n") els.noteInput.focus();
    if (k === "f") els.focusInput.focus();
    if (k === "p") {
      state.timer.running = !state.timer.running;
      save();
    }
  });
}

function computeStreak(doneDates) {
  if (!doneDates.length) return 0;
  const set = new Set(doneDates);
  let streak = 0;
  const d = new Date();

  while (set.has(todayKey(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function initialize() {
  setTheme(state.theme || "dark");
  renderFocus();
  renderTasks();
  renderNotes();
  renderHabits();
  renderTimer();
  renderStats();
}

load();
bindEvents();
initialize();
startTimerLoop();
