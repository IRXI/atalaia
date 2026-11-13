import {
  LINHAS,
  MISSOES,
  dailyItem,
  formatStreak,
  localDate,
  nextStreak,
  nextLine,
  pickId,
  videoUrl,
  visibleEntries,
} from "./logic.js";

const LAST_KEY = "atalaia:lastId";
const STREAK_KEY = "atalaia:streak";
const HIDDEN_KEY = "atalaia:hidden";
const DB_NAME = "atalaia";
const STORE = "videos";

const player = document.querySelector("#player");
const empty = document.querySelector("#empty");
const aviso = document.querySelector("#aviso");
const linha = document.querySelector("#linha");
const sequencia = document.querySelector("#sequencia");
const missao = document.querySelector("#missao");
const btnOuvir = document.querySelector("#btn-ouvir");
const btnPassar = document.querySelector("#btn-passar");
const btnRetirar = document.querySelector("#btn-retirar");
const inputFile = document.querySelector("#input-file");
const inputDir = document.querySelector("#input-dir");
const lista = document.querySelector("#lista");
const listaRows = document.querySelector("#lista-rows");

let entries = [];
let current = null;
let objectUrl = "";
let playToken = 0;
const failed = new Set();

function readStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || "null");
  } catch {
    return null;
  }
}

function readHidden() {
  try {
    const data = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
    return Array.isArray(data) ? data.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function hideClip(id) {
  const hidden = readHidden();
  if (hidden.includes(id)) return;
  hidden.push(id);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbAll(db) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function idbPut(db, record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbDelete(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function showAviso(text) {
  aviso.hidden = !text;
  aviso.textContent = text || "";
}

async function folderNames() {
  try {
    const response = await fetch("manifest.json", { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.videos) ? data.videos.filter((name) => typeof name === "string") : [];
  } catch {
    return [];
  }
}

function isVideo(file) {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|m4v|ogv)$/i.test(file.name);
}

async function saveFiles(fileList) {
  const files = [...fileList].filter(isVideo);
  if (!files.length) {
    showAviso("Esse arquivo não é um vídeo.");
    return;
  }
  try {
    const db = await openDb();
    for (const file of files) {
      const id = `up:${file.name}:${file.size}:${file.lastModified}`;
      await idbPut(db, {
        id,
        name: file.name,
        type: file.type || "video/mp4",
        blob: file,
        addedAt: Date.now(),
      });
    }
  } catch {
    showAviso("Não foi possível guardar o vídeo neste navegador.");
    return;
  }
  const wasEmpty = entries.length === 0;
  await loadLibrary();
  if (wasEmpty) playRandom(true);
}

async function loadLibrary() {
  const names = await folderNames();
  const known = new Set(names);
  let uploads = [];
  try {
    uploads = await idbAll(await openDb());
  } catch {
    showAviso("Não foi possível abrir a biblioteca neste navegador.");
  }
  const folderEntries = names.map((name) => ({
    id: `lib:${name}`,
    name,
    kind: "lib",
    src: videoUrl(name),
  }));
  const uploadEntries = uploads
    .filter((item) => item?.blob && !known.has(item.name))
    .map((item) => ({
      id: item.id,
      name: item.name,
      kind: "up",
      blob: item.blob,
    }));
  entries = visibleEntries([...folderEntries, ...uploadEntries], readHidden());
  empty.hidden = entries.length > 0;
  if (!entries.length) {
    current = null;
    playToken += 1;
    player.removeAttribute("src");
    player.hidden = true;
    btnOuvir.hidden = true;
    btnRetirar.hidden = true;
  } else {
    player.hidden = false;
  }
}

function playEntry(entry, keepSound) {
  if (!entry) return;
  playToken += 1;
  const token = playToken;
  current = entry;
  failed.delete(entry.id);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = "";
  if (entry.blob) {
    objectUrl = URL.createObjectURL(entry.blob);
    player.src = objectUrl;
  } else {
    player.src = entry.src;
  }
  player.hidden = false;
  empty.hidden = true;
  btnRetirar.hidden = entry.kind !== "up";
  localStorage.setItem(LAST_KEY, entry.id);
  if (!keepSound) player.muted = true;
  player.dataset.token = String(token);
  const started = player.play();
  btnOuvir.hidden = false;
  if (started) started.catch(() => {});
}

function passar() {
  const ids = entries.map((entry) => entry.id).filter((id) => !failed.has(id));
  const nextId = pickId(ids, current?.id || null);
  if (!nextId) {
    showAviso("Não foi possível reproduzir os vídeos.");
    return;
  }
  showAviso("");
  const keepSound = !player.muted;
  linha.textContent = nextLine(LINHAS, linha.textContent);
  playEntry(entries.find((entry) => entry.id === nextId), keepSound);
}

function playRandom(force) {
  const ids = entries.map((entry) => entry.id).filter((id) => !failed.has(id));
  const lastId = localStorage.getItem(LAST_KEY);
  const nextId = pickId(ids, force ? null : lastId);
  if (!nextId) {
    showAviso("Não foi possível reproduzir os vídeos.");
    return;
  }
  showAviso("");
  playEntry(entries.find((entry) => entry.id === nextId));
}

function paintDay() {
  const today = localDate(new Date());
  const streak = nextStreak(readStreak(), today);
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  linha.textContent = dailyItem(LINHAS, today);
  missao.textContent = dailyItem(MISSOES, today);
  sequencia.textContent = formatStreak(streak.streak);
}

async function boot() {
  paintDay();
  await loadLibrary();
  if (entries.length) playRandom(false);
}

player.addEventListener("error", () => {
  const entry = current;
  if (!entry || player.dataset.token !== String(playToken)) return;
  failed.add(entry.id);
  const remaining = entries.some((item) => !failed.has(item.id));
  if (remaining) playRandom(true);
  else showAviso("Não foi possível reproduzir os vídeos.");
});

player.addEventListener("click", () => {
  if (!current) return;
  if (player.paused) player.play();
  else player.pause();
});

btnPassar.addEventListener("click", () => {
  if (!entries.length) return;
  passar();
});

btnOuvir.addEventListener("click", async () => {
  player.muted = !player.muted;
  btnOuvir.textContent = player.muted ? "Ouvir" : "Silenciar";
  try {
    await player.play();
  } catch {
    showAviso("O navegador bloqueou o som. Toque de novo em Ouvir.");
  }
});

async function removeUpload(id) {
  const db = await openDb();
  await idbDelete(db, id);
}

function paintList() {
  listaRows.replaceChildren();
  if (!entries.length) {
    const note = document.createElement("li");
    note.className = "lista-empty";
    note.textContent = "Nenhum vídeo na rotação.";
    listaRows.append(note);
    return;
  }
  for (const entry of entries) {
    const row = document.createElement("li");
    row.className = "lista-row";
    const name = document.createElement("span");
    name.className = "lista-name";
    name.textContent = entry.name;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "metal quiet";
    button.dataset.id = entry.id;
    button.textContent = "Tirar";
    row.append(name, button);
    listaRows.append(row);
  }
}

async function tirar(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;
  if (entry.kind === "up") await removeUpload(entry.id);
  else hideClip(entry.id);
  await loadLibrary();
  paintList();
}

function voltar() {
  const stillThere = current && entries.some((entry) => entry.id === current.id);
  lista.hidden = true;
  if (stillThere || !entries.length) return;
  playRandom(true);
}

btnRetirar.addEventListener("click", async () => {
  if (!current || current.kind !== "up") return;
  await removeUpload(current.id);
  await loadLibrary();
  if (entries.length) playRandom(true);
});

document.querySelector("#btn-lista").addEventListener("click", () => {
  paintList();
  lista.hidden = false;
});

document.querySelector("#btn-voltar").addEventListener("click", voltar);

listaRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  tirar(button.dataset.id);
});

function bindPicker(button, input) {
  button.addEventListener("click", () => input.click());
}

bindPicker(document.querySelector("#btn-add"), inputFile);
bindPicker(document.querySelector("#btn-add-empty"), inputFile);
bindPicker(document.querySelector("#btn-pasta"), inputDir);
bindPicker(document.querySelector("#btn-pasta-empty"), inputDir);

inputFile.addEventListener("change", () => {
  if (inputFile.files?.length) saveFiles(inputFile.files);
  inputFile.value = "";
});

inputDir.addEventListener("change", () => {
  if (inputDir.files?.length) saveFiles(inputDir.files);
  inputDir.value = "";
});

boot();
