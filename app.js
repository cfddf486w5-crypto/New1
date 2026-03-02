const STORAGE_KEY = "opsHubV1";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
state.theme = state.theme || "dark";
state.globalTasks = state.globalTasks || [];
state.pallet = state.pallet || { next: 1, active: [], history: [], registry: [] };
state.consolidation = state.consolidation || { receipts: [] };
state.remise = state.remise || { next: 1, active: {}, archive: [] };
state.users = state.users || [];
state.kb = state.kb || "";

const $ = (id) => document.getElementById(id);
const page = document.body.dataset.page;

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function id(prefix, n, len = 7) { return `${prefix}${String(n).padStart(len, "0")}`; }
function setTheme(next) { document.body.classList.toggle("light", next === "light"); state.theme = next; save(); }
setTheme(state.theme);

$("themeToggle")?.addEventListener("click", () => setTheme(state.theme === "light" ? "dark" : "light"));

function renderGlobalTasks() {
  const ul = $("globalTaskList");
  if (!ul) return;
  ul.innerHTML = "";
  [...state.globalTasks].reverse().forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${t}</span><button class="btn ghost" data-i="${i}">Supprimer</button>`;
    ul.appendChild(li);
  });
  ul.querySelectorAll("button").forEach((b) => b.onclick = () => {
    const idx = state.globalTasks.length - 1 - Number(b.dataset.i);
    state.globalTasks.splice(idx, 1); save(); renderGlobalTasks();
  });
}

if (page === "dashboard") {
  renderGlobalTasks();
  $("globalTaskForm").onsubmit = (e) => {
    e.preventDefault();
    state.globalTasks.push($("globalTaskInput").value.trim());
    $("globalTaskInput").value = "";
    save(); renderGlobalTasks();
  };
}

function renderInventaire() {
  const activeId = id("BE", state.pallet.next);
  $("activePalette").textContent = activeId;
  $("scanList").innerHTML = state.pallet.active.map((r) => `<li><span>${r.code}</span><span>${r.item}</span></li>`).join("");
  $("historyList").innerHTML = [...state.pallet.history].reverse().map((h) => `<li><span>${h.id}</span><span>${h.count} lignes</span></li>`).join("");
  $("registryList").innerHTML = [...state.pallet.registry].reverse().map((r) => `<li>${r.id} | ${r.code} | ${r.qr}</li>`).join("");
}

if (page === "inventaire") {
  renderInventaire();
  $("scanForm").onsubmit = (e) => {
    e.preventDefault();
    state.pallet.active.push({ code: $("scanInput").value.trim(), item: $("itemInput").value.trim() });
    $("scanInput").value = ""; $("itemInput").value = "";
    save(); renderInventaire(); $("scanInput").focus();
  };
  $("closePaletteBtn").onclick = () => {
    const pid = id("BE", state.pallet.next);
    state.pallet.history.push({ id: pid, count: state.pallet.active.length, lines: state.pallet.active });
    state.pallet.registry.push({ id: pid, code: `PAL-${pid}`, qr: `QR-${pid}` });
    state.pallet.active = []; state.pallet.next += 1;
    save(); renderInventaire();
  };
}

function classify(qty) {
  if (qty >= 1 && qty <= 6) return "report1";
  if (qty >= 7 && qty <= 20) return "report2";
  return "validation";
}
function renderConsolidation() {
  const r1 = $("report1"), r2 = $("report2"), rv = $("validationList");
  if (!r1) return;
  r1.innerHTML = ""; r2.innerHTML = ""; rv.innerHTML = "";
  state.consolidation.receipts.forEach((line) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${line.sku} → ${line.bin} (${line.qty})</span><button class="btn ghost">Why</button>`;
    const c = classify(line.qty);
    (c === "report1" ? r1 : c === "report2" ? r2 : rv).appendChild(li);
  });
}
if (page === "consolidation") {
  renderConsolidation();
  $("addReceiptBtn").onclick = () => {
    const raw = $("receiptInput").value.trim();
    const [sku, bin, qtyTxt] = raw.split(";");
    const qty = Number(qtyTxt);
    if (!sku || !bin || Number.isNaN(qty)) return;
    state.consolidation.receipts.push({ sku, bin, qty });
    $("receiptInput").value = "";
    save(); renderConsolidation();
  };
  $("simulateBtn").onclick = () => {
    alert("Simulation complétée: tri criticité + split max 3 + staging priorisé (prototype offline).");
  };
}

function renderRemise() {
  const rid = id("LAVREM", state.remise.next, 4);
  $("remiseId").textContent = rid;
  const items = Object.entries(state.remise.active);
  $("remiseList").innerHTML = items.map(([item, qty]) => `<li><span>${item}</span><span>QTY ${qty}</span></li>`).join("");
  $("remiseArchive").innerHTML = [...state.remise.archive].reverse().map((a) => `<li>${a.id} • ${a.total} pièces</li>`).join("");
}
if (page === "remise") {
  renderRemise();
  $("remiseScanForm").onsubmit = (e) => {
    e.preventDefault();
    const item = $("remiseItem").value.trim();
    state.remise.active[item] = (state.remise.active[item] || 0) + 1;
    $("remiseItem").value = "";
    save(); renderRemise();
  };
  $("archiveRemiseBtn").onclick = () => {
    const total = Object.values(state.remise.active).reduce((a, b) => a + b, 0);
    state.remise.archive.push({ id: id("LAVREM", state.remise.next, 4), total });
    state.remise.active = {}; state.remise.next += 1;
    save(); renderRemise();
  };
}

function renderUsers() {
  const ul = $("userList");
  if (!ul) return;
  ul.innerHTML = state.users.map((u, i) => `<li><span>${u}</span><button class="btn ghost" data-i="${i}">Supprimer</button></li>`).join("");
  ul.querySelectorAll("button").forEach((b) => b.onclick = () => {
    state.users.splice(Number(b.dataset.i), 1); save(); renderUsers();
  });
}
if (page === "parametres") {
  $("kbInput").value = state.kb;
  renderUsers();
  $("userForm").onsubmit = (e) => {
    e.preventDefault(); state.users.push($("userInput").value.trim()); $("userInput").value = ""; save(); renderUsers();
  };
  $("saveKbBtn").onclick = () => { state.kb = $("kbInput").value; save(); alert("KB sauvegardée localement."); };
  $("exportAllBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "ops_hub_annexes.json"; a.click();
    URL.revokeObjectURL(a.href);
  };
}
