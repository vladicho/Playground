import { renderMathIn } from "./math.js";
import {
  applyTranslations,
  getLanguage,
  getLocale,
  localizePrompt,
  onLanguageChange,
  t,
} from "./i18n.js";

const conversation = document.querySelector("#conversation");
const form = document.querySelector("#chat-form");
const input = document.querySelector("#question");
const sendButton = document.querySelector("#send-button");
const clearButton = document.querySelector("#clear-chat");
const modeButtons = document.querySelectorAll("[data-mode]");
const catalogDialog = document.querySelector("#catalog-dialog");
const catalogOpen = document.querySelector("#catalog-open");
const catalogClose = document.querySelector("#catalog-close");
const catalogQuery = document.querySelector("#catalog-query");
const catalogCategory = document.querySelector("#catalog-category");
const catalogIndexed = document.querySelector("#catalog-indexed");
const catalogCount = document.querySelector("#catalog-count");
const catalogResults = document.querySelector("#catalog-results");
const catalogMore = document.querySelector("#catalog-more");
const queueCount = document.querySelector("#queue-count");
const queueToggle = document.querySelector("#queue-toggle");
const queueBody = document.querySelector("#queue-body");
const queueList = document.querySelector("#queue-list");
const queueRemote = document.querySelector("#queue-remote");
const queueCopy = document.querySelector("#queue-copy");
const queueClear = document.querySelector("#queue-clear");
const queueFeedback = document.querySelector("#queue-feedback");
const notebookDialog = document.querySelector("#notebook-dialog");
const notebookOpen = document.querySelector("#notebook-open");
const notebookClose = document.querySelector("#notebook-close");
const notebookQuery = document.querySelector("#notebook-query");
const notebookMode = document.querySelector("#notebook-mode");
const notebookStatus = document.querySelector("#notebook-status");
const notebookCount = document.querySelector("#notebook-count");
const notebookProgress = document.querySelector("#notebook-progress");
const notebookResults = document.querySelector("#notebook-results");
const notebookPrint = document.querySelector("#notebook-print");
const reviewDue = document.querySelector("#review-due");
const reviewLearning = document.querySelector("#review-learning");
const reviewMastered = document.querySelector("#review-mastered");
const reviewStreak = document.querySelector("#review-streak");
const reviewPercent = document.querySelector("#review-percent");
const reviewProgressBar = document.querySelector("#review-progress-bar");
const bookProgressList = document.querySelector("#book-progress-list");
const topicProgressList = document.querySelector("#topic-progress-list");
const planDialog = document.querySelector("#plan-dialog");
const planOpen = document.querySelector("#plan-open");
const planClose = document.querySelector("#plan-close");
const planPlanned = document.querySelector("#plan-planned");
const planStudied = document.querySelector("#plan-studied");
const planCompleted = document.querySelector("#plan-completed");
const planPercent = document.querySelector("#plan-percent");
const planProgress = document.querySelector("#plan-progress");
const planDefaultMinutes = document.querySelector("#plan-default-minutes");
const planGenerate = document.querySelector("#plan-generate");
const planAddForm = document.querySelector("#plan-add-form");
const planTaskTitle = document.querySelector("#plan-task-title");
const planTaskDate = document.querySelector("#plan-task-date");
const planTaskMinutes = document.querySelector("#plan-task-minutes");
const studyTimer = document.querySelector("#study-timer");
const studyTimerTitle = document.querySelector("#study-timer-title");
const studyTimerTime = document.querySelector("#study-timer-time");
const studyTimerToggle = document.querySelector("#study-timer-toggle");
const studyTimerFinish = document.querySelector("#study-timer-finish");
const planPrevWeek = document.querySelector("#plan-prev-week");
const planNextWeek = document.querySelector("#plan-next-week");
const planCurrentWeek = document.querySelector("#plan-current-week");
const planWeekLabel = document.querySelector("#plan-week-label");
const planCalendar = document.querySelector("#plan-calendar");

function videoStoryboardInstruction() {
  if (getLanguage() === "es") {
    return `Además del guion, interpreta la explicación como una lección visual. Al final incluye obligatoriamente un bloque VIDEOAULA_JSON con JSON válido y sin cercas de código. Usa de 4 a 10 escenas y elige el tipo que realmente ayude a comprender, no una diapositiva de transcripción. Formato:
VIDEOAULA_JSON
{"title":"Título breve","scenes":[{"type":"title|equation|square|squareExpansion|groups|bars|numberLine|coordinate|diagram|table|final","heading":"Idea breve","caption":"Una frase de apoyo","duration":6,"steps":["paso 1","paso 2"],"sideLabel":"n","remainder":36,"total":3061,"equation":"2n+1=111","result":"3061 hombres","verification":"56²-75=3061"}]}
FIM_VIDEOAULA_JSON
Incluye solo los campos útiles para cada escena. Para squareExpansion usa sideLabel y equation; para groups usa groups [{"label":"...","count":4}]; para bars usa bars [{"label":"...","value":36}]; para numberLine usa min, max y points [{"value":0,"label":"..."}]; para coordinate usa points [{"x":0,"y":0,"label":"..."}] y segments [[0,1]]; para diagram usa nodes [{"id":"a","label":"...","x":0.2,"y":0.5}] y edges [{"from":"a","to":"b","label":"..."}]; para table usa headers y rows. El video debe mostrar objetos, relaciones espaciales, transformaciones y cuentas progresivas. No copies párrafos del guion en caption.`;
  }
  return `Além do roteiro, interprete a explicação como uma aula visual. No final inclua obrigatoriamente um bloco VIDEOAULA_JSON com JSON válido e sem cercas de código. Use de 4 a 10 cenas e escolha o tipo que realmente ajude a compreender, não um slide de transcrição. Formato:
VIDEOAULA_JSON
{"title":"Título curto","scenes":[{"type":"title|equation|square|squareExpansion|groups|bars|numberLine|coordinate|diagram|table|final","heading":"Ideia curta","caption":"Uma frase de apoio","duration":6,"steps":["passo 1","passo 2"],"sideLabel":"n","remainder":36,"total":3061,"equation":"2n+1=111","result":"3061 homens","verification":"56²-75=3061"}]}
FIM_VIDEOAULA_JSON
Inclua apenas os campos úteis em cada cena. Para squareExpansion use sideLabel e equation; para groups use groups [{"label":"...","count":4}]; para bars use bars [{"label":"...","value":36}]; para numberLine use min, max e points [{"value":0,"label":"..."}]; para coordinate use points [{"x":0,"y":0,"label":"..."}] e segments [[0,1]]; para diagram use nodes [{"id":"a","label":"...","x":0.2,"y":0.5}] e edges [{"from":"a","to":"b","label":"..."}]; para table use headers e rows. O vídeo deve mostrar objetos, relações espaciais, transformações e contas progressivas. Não copie parágrafos do roteiro em caption.`;
}

const MODES = {
  ask: {
    placeholder: "Pergunte sobre os documentos…",
    prompt: (topic) => topic,
  },
  summary: {
    placeholder: "Assunto ou nome do documento para resumir…",
    prompt: (topic) =>
      localizePrompt('Crie um resumo didático sobre "{topic}" usando somente informações sustentadas pelos documentos recuperados. Organize em: visão geral, conceitos principais, fórmulas ou definições importantes e pontos para revisar. Diferencie claramente o conteúdo das fontes de qualquer explicação sua.', topic),
  },
  quiz: {
    placeholder: "Assunto do quiz…",
    prompt: (topic) =>
      localizePrompt('Crie um quiz de estudo sobre "{topic}" com 5 questões objetivas baseadas nos documentos recuperados. Dê quatro alternativas por questão. Coloque o gabarito comentado somente depois de todas as perguntas e explique qual informação da fonte sustenta cada resposta.', topic),
  },
  flashcards: {
    placeholder: "Assunto dos flashcards…",
    prompt: (topic) =>
      localizePrompt('Crie 10 flashcards sobre "{topic}" com base nos documentos recuperados. Use o formato numerado "Frente:" e "Verso:". Faça cartões curtos, sem repetir ideias, e não invente informações ausentes nas fontes.', topic),
  },
  mindmap: {
    placeholder: "Assunto do mapa mental…",
    prompt: (topic) =>
      localizePrompt('Crie um mapa mental sobre "{topic}" usando os documentos recuperados. Dê uma introdução curta e depois inclua obrigatoriamente um bloco entre as linhas "MAPA MENTAL" e "FIM DO MAPA". Dentro dele, use apenas marcadores com hífen: a primeira linha sem recuo é o tema central; ramos usam dois espaços de recuo; sub-ramos usam quatro espaços. Limite a 24 nós com textos curtos. Inclua conceitos, relações, fórmulas e exemplos somente quando sustentados pelas fontes.', topic),
  },
  podcast: {
    placeholder: "Assunto do roteiro de podcast…",
    prompt: (topic) =>
      `${localizePrompt('Crie um roteiro curto de podcast educativo, de aproximadamente 3 minutos, sobre "{topic}". Use duas vozes chamadas Apresentador e Especialista, linguagem natural e explicações baseadas nos documentos recuperados. Termine com três pontos de revisão. Não invente fatos ausentes nas fontes.', topic)}\n\n${videoStoryboardInstruction()}`,
  },
  exam: {
    placeholder: "Assunto ou documento do simulado…",
    prompt: (topic) =>
      localizePrompt('Crie um simulado sobre "{topic}" usando somente informações sustentadas pelos documentos recuperados. Produza exatamente 5 questões, cada uma com 4 alternativas plausíveis e apenas uma correta. Retorne somente um bloco no formato abaixo, com JSON válido e sem cercas de código ou comentários:\nSIMULADO_JSON\n{"title":"Título curto","questions":[{"question":"Enunciado","options":["Alternativa A","Alternativa B","Alternativa C","Alternativa D"],"correct":0,"explanation":"Correção comentada","source":"Nome do documento que sustenta a questão"}]}\nFIM_SIMULADO_JSON\nO campo correct deve ser um inteiro de 0 a 3. Use notação matemática simples ou escape corretamente barras invertidas do LaTeX dentro do JSON. Não revele respostas fora do JSON.', topic),
  },
};

const MODE_LABELS = {
  ask: "Resposta da biblioteca",
  summary: "Resumo",
  quiz: "Quiz",
  flashcards: "Flashcards",
  mindmap: "Mapa mental",
  podcast: "Roteiro de podcast",
  exam: "Simulado",
};

const state = {
  messages: [],
  busy: false,
  mode: "ask",
};

let activeSpeech = null;
let catalogBooks = null;
let catalogVisible = 36;
const QUEUE_LIMIT = 10;
const QUEUE_STORAGE_KEY = "playground-index-queue-v1";
const REMOTE_STORAGE_KEY = "playground-rclone-remote-v1";
const NOTEBOOK_STORAGE_KEY = "playground-study-notebook-v1";
const NOTEBOOK_LIMIT = 150;
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const PLAN_STORAGE_KEY = "playground-study-plan-v1";

function loadStudyPlan() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PLAN_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") throw new Error();
    return {
      settings: {
        days: Array.isArray(saved.settings?.days)
          ? saved.settings.days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
          : [1, 2, 3, 4, 5, 6],
        minutes: Number.isInteger(saved.settings?.minutes)
          ? Math.max(5, Math.min(saved.settings.minutes, 240))
          : 45,
      },
      tasks: Array.isArray(saved.tasks)
        ? saved.tasks.filter(
            (task) =>
              task &&
              typeof task.id === "string" &&
              typeof task.title === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(task.date),
          ).slice(-500)
        : [],
      sessions: Array.isArray(saved.sessions)
        ? saved.sessions.filter(
            (session) =>
              session &&
              typeof session.id === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(session.date) &&
              Number.isFinite(session.seconds),
          ).slice(-1_000)
        : [],
      activeTimer:
        saved.activeTimer &&
        typeof saved.activeTimer.taskId === "string" &&
        Number.isFinite(saved.activeTimer.totalSeconds) &&
        Number.isFinite(saved.activeTimer.remainingSeconds)
          ? saved.activeTimer
          : null,
    };
  } catch {
    return {
      settings: { days: [1, 2, 3, 4, 5, 6], minutes: 45 },
      tasks: [],
      sessions: [],
      activeTimer: null,
    };
  }
}

let studyPlan = loadStudyPlan();
let planWeekOffset = 0;
let studyTimerInterval = null;

function persistStudyPlan() {
  try {
    window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(studyPlan));
    return true;
  } catch {
    return false;
  }
}

function addDays(value, days) {
  const date = new Date(value);
  const base = Number.isNaN(date.getTime()) ? new Date() : date;
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

function normalizeNotebookEntry(entry) {
  const createdAt = Number.isNaN(new Date(entry.createdAt).getTime())
    ? new Date().toISOString()
    : entry.createdAt;
  const fallbackStage = entry.reviewed ? 1 : 0;
  const reviewStage = Number.isInteger(entry.reviewStage)
    ? Math.max(0, Math.min(entry.reviewStage, REVIEW_INTERVALS.length))
    : fallbackStage;
  const nextReviewAt = Number.isNaN(new Date(entry.nextReviewAt).getTime())
    ? addDays(createdAt, REVIEW_INTERVALS[Math.min(reviewStage, REVIEW_INTERVALS.length - 1)])
    : entry.nextReviewAt;
  const reviewHistory = Array.isArray(entry.reviewHistory)
    ? entry.reviewHistory.filter((value) => !Number.isNaN(new Date(value).getTime())).slice(-100)
    : [];
  return {
    ...entry,
    createdAt,
    reviewed: Boolean(entry.reviewed || reviewHistory.length),
    reviewStage,
    nextReviewAt,
    reviewHistory,
  };
}

function loadNotebook() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(NOTEBOOK_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .filter(
        (entry) =>
          entry &&
          typeof entry.id === "string" &&
          typeof entry.title === "string" &&
          typeof entry.answer === "string",
      )
      .map(normalizeNotebookEntry)
      .slice(0, NOTEBOOK_LIMIT);
  } catch {
    return [];
  }
}

let notebookEntries = loadNotebook();

function persistNotebook() {
  try {
    window.localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(notebookEntries));
    return true;
  } catch {
    return false;
  }
}

function loadSavedQueue() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(QUEUE_STORAGE_KEY) || "[]");
    return new Set(
      Array.isArray(saved)
        ? saved.filter((item) => typeof item === "string").slice(0, QUEUE_LIMIT)
        : [],
    );
  } catch {
    return new Set();
  }
}

const catalogQueue = loadSavedQueue();

function saveQueue() {
  window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify([...catalogQueue]));
}

function shellQuote(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function validatedRemote() {
  const value = queueRemote.value.trim().replace(/\/+$/, "");
  return /^[A-Za-z0-9._-]+:[^\s"'`]+$/.test(value) ? value : null;
}

async function copyPlainText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = value;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.append(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    return copied;
  }
}

function renderQueue() {
  queueCount.textContent = `${catalogQueue.size}/${QUEUE_LIMIT}`;
  queueList.replaceChildren();
  const selected = catalogBooks
    ? catalogBooks.filter((book) => catalogQueue.has(book.filename) && !book.indexed)
    : [...catalogQueue].map((filename) => ({ filename, title: filename.replace(/\.pdf$/i, "") }));

  if (selected.length === 0) {
    const empty = document.createElement("li");
    empty.className = "queue-empty";
    empty.textContent = "Nenhum livro na fila.";
    queueList.append(empty);
  }

  for (const book of selected) {
    const item = document.createElement("li");
    const title = document.createElement("span");
    title.textContent = book.title;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remover";
    remove.addEventListener("click", () => {
      catalogQueue.delete(book.filename);
      saveQueue();
      queueFeedback.textContent = "";
      renderQueue();
      renderCatalog();
    });
    item.append(title, remove);
    queueList.append(item);
  }

  queueCopy.disabled = selected.length === 0;
  queueClear.disabled = selected.length === 0;
}

function toggleQueuedBook(book) {
  if (book.indexed) return;
  queueFeedback.textContent = "";
  if (catalogQueue.has(book.filename)) {
    catalogQueue.delete(book.filename);
  } else if (catalogQueue.size < QUEUE_LIMIT) {
    catalogQueue.add(book.filename);
  } else {
    queueFeedback.textContent = "A fila aceita no máximo 10 livros por lote.";
    queueBody.hidden = false;
    queueToggle.textContent = "Fechar fila";
    queueToggle.setAttribute("aria-expanded", "true");
  }
  saveQueue();
  renderQueue();
  renderCatalog();
}

function newNotebookId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function notebookLevel(entry) {
  if (entry.reviewStage === 0) return t("Novo");
  if (entry.reviewStage < 3) return t("Aprendendo");
  return t("Dominado");
}

function isReviewDue(entry, now = Date.now()) {
  const next = new Date(entry.nextReviewAt).getTime();
  return !Number.isNaN(next) && next <= now;
}

function formatReviewDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("sem data");
  if (isReviewDue({ nextReviewAt: value })) return t("agora");
  return new Intl.DateTimeFormat(getLocale(), { dateStyle: "short" }).format(date);
}

function localDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateReviewStreak() {
  const days = new Set(
    notebookEntries.flatMap((entry) => entry.reviewHistory || []).map(localDayKey).filter(Boolean),
  );
  if (days.size === 0) return 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!days.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function scheduleReview(entry, rating) {
  const now = new Date();
  if (rating === "hard") {
    entry.reviewStage = Math.max(0, entry.reviewStage - 1);
  } else if (rating === "easy") {
    entry.reviewStage = Math.min(REVIEW_INTERVALS.length, entry.reviewStage + 2);
  } else {
    entry.reviewStage = Math.min(REVIEW_INTERVALS.length, entry.reviewStage + 1);
  }
  const intervalIndex = rating === "hard"
    ? 0
    : Math.min(entry.reviewStage, REVIEW_INTERVALS.length - 1);
  entry.reviewed = true;
  entry.lastReviewedAt = now.toISOString();
  entry.nextReviewAt = addDays(now, REVIEW_INTERVALS[intervalIndex]);
  entry.reviewHistory = [...(entry.reviewHistory || []), now.toISOString()].slice(-100);
  persistNotebook();
  renderNotebook();
}

function renderReviewDashboard() {
  const due = notebookEntries.filter((entry) => isReviewDue(entry)).length;
  notebookOpen.textContent = due ? `Caderno (${due})` : "Caderno";
  const learning = notebookEntries.filter(
    (entry) => entry.reviewStage > 0 && entry.reviewStage < 3,
  ).length;
  const mastered = notebookEntries.filter((entry) => entry.reviewStage >= 3).length;
  const percent = notebookEntries.length
    ? Math.round(
        (notebookEntries.reduce(
          (sum, entry) => sum + Math.min(entry.reviewStage, REVIEW_INTERVALS.length),
          0,
        ) /
          (notebookEntries.length * REVIEW_INTERVALS.length)) *
          100,
      )
    : 0;
  reviewDue.textContent = String(due);
  reviewLearning.textContent = String(learning);
  reviewMastered.textContent = String(mastered);
  reviewStreak.textContent = String(calculateReviewStreak());
  reviewPercent.textContent = `${percent}%`;
  reviewProgressBar.value = percent;
  reviewProgressBar.textContent = `${percent}%`;

  const books = new Map();
  for (const entry of notebookEntries) {
    const names = Array.isArray(entry.sources) && entry.sources.length
      ? [...new Set(entry.sources.map((source) => source.name || "Fonte não identificada"))]
      : ["Sem livro identificado"];
    for (const name of names) {
      const current = books.get(name) || { count: 0, stages: 0, due: 0 };
      current.count += 1;
      current.stages += Math.min(entry.reviewStage, REVIEW_INTERVALS.length);
      if (isReviewDue(entry)) current.due += 1;
      books.set(name, current);
    }
  }
  bookProgressList.replaceChildren();
  const sorted = [...books].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], getLocale()));
  if (sorted.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Salve materiais com fontes para acompanhar livros.";
    bookProgressList.append(empty);
  }
  for (const [name, details] of sorted) {
    const row = document.createElement("div");
    const label = document.createElement("span");
    label.textContent = name;
    const value = document.createElement("strong");
    const progress = Math.round((details.stages / (details.count * REVIEW_INTERVALS.length)) * 100);
    value.textContent = `${progress}%${details.due ? ` · ${details.due} pendente(s)` : ""}`;
    row.append(label, value);
    bookProgressList.append(row);
  }

  const topics = new Map();
  for (const entry of notebookEntries) {
    const current = topics.get(entry.title) || { count: 0, stages: 0, due: 0 };
    current.count += 1;
    current.stages += Math.min(entry.reviewStage, REVIEW_INTERVALS.length);
    if (isReviewDue(entry)) current.due += 1;
    topics.set(entry.title, current);
  }
  topicProgressList.replaceChildren();
  const sortedTopics = [...topics].sort(
    (a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], getLocale()),
  );
  if (sortedTopics.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Salve materiais para acompanhar assuntos.";
    topicProgressList.append(empty);
  }
  for (const [name, details] of sortedTopics) {
    const row = document.createElement("div");
    const label = document.createElement("span");
    label.textContent = name;
    const value = document.createElement("strong");
    const progress = Math.round(
      (details.stages / (details.count * REVIEW_INTERVALS.length)) * 100,
    );
    value.textContent = `${progress}%${details.due ? ` · ${details.due} pendente(s)` : ""}`;
    row.append(label, value);
    topicProgressList.append(row);
  }
}

function filteredNotebookEntries() {
  const query = normalizeSearch(notebookQuery.value);
  const mode = notebookMode.value;
  const status = notebookStatus.value;
  return notebookEntries.filter((entry) => {
    if (mode && entry.mode !== mode) return false;
    if (status === "due" && !isReviewDue(entry)) return false;
    if (status === "new" && entry.reviewStage !== 0) return false;
    if (status === "learning" && !(entry.reviewStage > 0 && entry.reviewStage < 3)) return false;
    if (status === "mastered" && entry.reviewStage < 3) return false;
    if (!query) return true;
    const searchable = [
      entry.title,
      entry.answer,
      entry.notes || "",
      ...(Array.isArray(entry.sources) ? entry.sources.map((source) => source.name || "") : []),
    ].join(" ");
    return normalizeSearch(searchable).includes(query);
  });
}

function saveMaterialToNotebook(material, button) {
  if (notebookEntries.length >= NOTEBOOK_LIMIT) {
    button.textContent = "Caderno cheio";
    return;
  }
  const entry = {
    id: newNotebookId(),
    title: material.title,
    mode: material.mode,
    answer: material.answer,
    sources: material.sources,
    notes: "",
    reviewed: false,
    reviewStage: 0,
    nextReviewAt: addDays(new Date(), REVIEW_INTERVALS[0]),
    reviewHistory: [],
    createdAt: new Date().toISOString(),
  };
  notebookEntries.unshift(entry);
  if (!persistNotebook()) {
    notebookEntries.shift();
    button.textContent = "Sem espaço local";
    return;
  }
  button.textContent = "Salvo no caderno";
  button.disabled = true;
  button.closest(".message")?.setAttribute("data-notebook-id", entry.id);
  renderNotebook();
}

function formatNotebookDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("Data não disponível");
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function appendNotebookSources(target, sources) {
  if (!Array.isArray(sources) || sources.length === 0) return;
  const section = document.createElement("section");
  section.className = "notebook-sources";
  const heading = document.createElement("strong");
  heading.textContent = "Fontes salvas";
  const list = document.createElement("ul");
  for (const source of sources) {
    const item = document.createElement("li");
    const score = typeof source.score === "number" ? ` · ${(source.score * 100).toFixed(1).replace(".", ",")}%` : "";
    const page = source.page ? ` · p. ${source.page}` : "";
    item.textContent = `${source.name || "Fonte"}${page}${score}`;
    list.append(item);
  }
  section.append(heading, list);
  target.append(section);
}

function renderNotebookBody(body, entry) {
  if (body.dataset.rendered === "true") return;
  body.dataset.rendered = "true";

  const answer = document.createElement("div");
  answer.className = "notebook-answer";
  answer.textContent = entry.answer;
  body.append(answer);
  const examRendered = entry.mode === "exam" && renderExam(body, answer, entry.answer, entry.title);
  if (!examRendered) renderMathIn(answer);
  if (entry.mode === "mindmap") renderMindMap(body, entry.answer, entry.title);
  appendNotebookSources(body, entry.sources);

  const reviewPanel = document.createElement("section");
  reviewPanel.className = "review-actions";
  const reviewHeading = document.createElement("div");
  const reviewTitle = document.createElement("strong");
  reviewTitle.textContent = "Como foi esta revisão?";
  const reviewHint = document.createElement("small");
  reviewHint.textContent = "A resposta define a próxima data automaticamente.";
  reviewHeading.append(reviewTitle, reviewHint);
  const ratingButtons = document.createElement("div");
  for (const [rating, label] of [
    ["hard", "Difícil · 1 dia"],
    ["good", "Boa · avançar"],
    ["easy", "Fácil · avançar 2"],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => scheduleReview(entry, rating));
    ratingButtons.append(button);
  }
  reviewPanel.append(reviewHeading, ratingButtons);
  body.append(reviewPanel);

  const noteLabel = document.createElement("label");
  noteLabel.className = "notebook-notes";
  const noteTitle = document.createElement("span");
  noteTitle.textContent = "Minhas anotações";
  const notes = document.createElement("textarea");
  notes.rows = 4;
  notes.maxLength = 4_000;
  notes.placeholder = "Escreva sua anotação…";
  notes.value = entry.notes || "";
  notes.addEventListener("change", () => {
    entry.notes = notes.value.trim();
    persistNotebook();
  });
  noteLabel.append(noteTitle, notes);
  body.append(noteLabel);
}

function renderNotebook() {
  const matches = filteredNotebookEntries();
  const reviewed = notebookEntries.filter((entry) => entry.reviewed).length;
  const due = notebookEntries.filter((entry) => isReviewDue(entry)).length;
  notebookCount.textContent = `${matches.length} ${matches.length === 1 ? "material exibido" : "materiais exibidos"}`;
  notebookProgress.textContent = `${reviewed}/${notebookEntries.length} revisados · ${due} pendente(s)`;
  notebookPrint.disabled = matches.length === 0;
  notebookResults.replaceChildren();
  renderReviewDashboard();

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "notebook-empty";
    empty.textContent = notebookEntries.length
      ? "Nenhum material corresponde aos filtros."
      : "Salve uma resposta da biblioteca para começar seu caderno.";
    notebookResults.append(empty);
    return;
  }

  for (const entry of matches) {
    const card = document.createElement("article");
    card.className = "notebook-card";
    card.classList.toggle("reviewed", Boolean(entry.reviewed));
    card.classList.toggle("due", isReviewDue(entry));
    card.classList.toggle("mastered", entry.reviewStage >= 3);

    const header = document.createElement("header");
    const heading = document.createElement("div");
    const meta = document.createElement("p");
    meta.textContent = `${t(MODE_LABELS[entry.mode] || MODE_LABELS.ask)} · ${notebookLevel(entry)} · ${getLanguage() === "es" ? "próxima" : "próxima"}: ${formatReviewDate(entry.nextReviewAt)}`;
    const title = document.createElement("h3");
    title.textContent = entry.title;
    heading.append(meta, title);

    const controls = document.createElement("div");
    controls.className = "notebook-card-controls";
    const open = document.createElement("button");
    open.type = "button";
    open.textContent = "Abrir";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Excluir";
    controls.append(open, remove);
    header.append(heading, controls);

    const body = document.createElement("div");
    body.className = "notebook-card-body";
    body.hidden = true;
    open.addEventListener("click", () => {
      body.hidden = !body.hidden;
      open.textContent = body.hidden ? "Abrir" : "Fechar";
      if (!body.hidden) renderNotebookBody(body, entry);
    });
    remove.addEventListener("click", () => {
      if (!window.confirm(getLanguage() === "es" ? `¿Eliminar "${entry.title}" del cuaderno?` : `Excluir "${entry.title}" do caderno?`)) return;
      notebookEntries = notebookEntries.filter((candidate) => candidate.id !== entry.id);
      persistNotebook();
      renderNotebook();
    });

    card.append(header, body);
    notebookResults.append(card);
  }
}

function printNotebook() {
  const entries = filteredNotebookEntries();
  if (entries.length === 0) return;
  const sheet = document.createElement("section");
  sheet.className = "notebook-print-sheet";
  const heading = document.createElement("header");
  const brand = document.createElement("p");
  brand.textContent = "Biblioteca Matemática";
  const title = document.createElement("h1");
  title.textContent = "Caderno de estudos";
  const metadata = document.createElement("p");
  metadata.textContent = `${entries.length} ${getLanguage() === "es" ? "materiales" : "materiais"} · ${new Intl.DateTimeFormat(getLocale(), { dateStyle: "long" }).format(new Date())}`;
  heading.append(brand, title, metadata);
  sheet.append(heading);

  for (const entry of entries) {
    const material = document.createElement("article");
    const materialTitle = document.createElement("h2");
    materialTitle.textContent = entry.title;
    const materialMeta = document.createElement("p");
    materialMeta.className = "notebook-print-meta";
    materialMeta.textContent = `${t(MODE_LABELS[entry.mode] || MODE_LABELS.ask)} · ${notebookLevel(entry)} · ${getLanguage() === "es" ? "próxima revisión" : "próxima revisão"}: ${formatReviewDate(entry.nextReviewAt)} · ${getLanguage() === "es" ? "guardado el" : "salvo em"} ${formatNotebookDate(entry.createdAt)}`;
    const answer = document.createElement("div");
    answer.className = "notebook-print-answer";
    answer.textContent = entry.answer;
    renderMathIn(answer);
    material.append(materialTitle, materialMeta, answer);
    appendNotebookSources(material, entry.sources);
    if (entry.notes) {
      const notes = document.createElement("section");
      notes.className = "notebook-print-notes";
      const noteTitle = document.createElement("strong");
      noteTitle.textContent = "Minhas anotações";
      const note = document.createElement("p");
      note.textContent = entry.notes;
      notes.append(noteTitle, note);
      material.append(notes);
    }
    sheet.append(material);
  }

  document.body.append(sheet);
  document.body.classList.add("notebook-printing");
  const previousTitle = document.title;
  document.title = `${t("Caderno de estudos")} - ${t("Biblioteca Matemática")}`;
  const cleanup = () => {
    sheet.remove();
    document.body.classList.remove("notebook-printing");
    document.title = previousTitle;
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  window.addEventListener("focus", cleanup, { once: true });
  window.print();
}

function planDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfPlanWeek(offset = planWeekOffset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const distanceFromMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - distanceFromMonday + offset * 7);
  return date;
}

function currentTimerRemaining() {
  const timer = studyPlan.activeTimer;
  if (!timer) return 0;
  if (!timer.running) return Math.max(0, Math.round(timer.remainingSeconds));
  const updatedAt = new Date(timer.updatedAt).getTime();
  const elapsed = Number.isNaN(updatedAt) ? 0 : Math.floor((Date.now() - updatedAt) / 1_000);
  return Math.max(0, Math.round(timer.remainingSeconds) - elapsed);
}

function stopStudyTimerInterval() {
  if (studyTimerInterval !== null) window.clearInterval(studyTimerInterval);
  studyTimerInterval = null;
}

function finishStudyTimer(expired = false) {
  const timer = studyPlan.activeTimer;
  if (!timer) return;
  const remaining = expired ? 0 : currentTimerRemaining();
  const elapsed = Math.max(0, Math.round(timer.totalSeconds - remaining));
  const task = studyPlan.tasks.find((candidate) => candidate.id === timer.taskId);
  if (elapsed > 0) {
    studyPlan.sessions.push({
      id: newNotebookId(),
      taskId: timer.taskId,
      date: planDateKey(),
      seconds: elapsed,
      completedAt: new Date().toISOString(),
    });
    studyPlan.sessions = studyPlan.sessions.slice(-1_000);
  }
  if (task) task.done = true;
  studyPlan.activeTimer = null;
  stopStudyTimerInterval();
  persistStudyPlan();
  renderStudyPlan();
}

function renderStudyTimer() {
  const timer = studyPlan.activeTimer;
  if (!timer) {
    studyTimer.hidden = true;
    stopStudyTimerInterval();
    return;
  }
  const task = studyPlan.tasks.find((candidate) => candidate.id === timer.taskId);
  if (!task) {
    studyPlan.activeTimer = null;
    persistStudyPlan();
    studyTimer.hidden = true;
    stopStudyTimerInterval();
    return;
  }
  const remaining = currentTimerRemaining();
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  studyTimer.hidden = false;
  studyTimerTitle.textContent = task.title;
  studyTimerTime.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  studyTimerTime.classList.toggle("ending", remaining <= 60);
  studyTimerToggle.textContent = timer.running ? "Pausar" : "Continuar";
  if (remaining <= 0) window.setTimeout(() => finishStudyTimer(true), 0);
}

function ensureStudyTimerInterval() {
  stopStudyTimerInterval();
  if (!studyPlan.activeTimer?.running) return;
  studyTimerInterval = window.setInterval(renderStudyTimer, 1_000);
}

function startStudyTask(task) {
  if (studyPlan.activeTimer && studyPlan.activeTimer.taskId !== task.id) {
    if (!window.confirm(t("Substituir a sessão que já está em andamento?"))) return;
  }
  const totalSeconds = Math.max(5, Math.min(task.minutes, 240)) * 60;
  studyPlan.activeTimer = {
    taskId: task.id,
    totalSeconds,
    remainingSeconds: totalSeconds,
    running: true,
    updatedAt: new Date().toISOString(),
  };
  persistStudyPlan();
  ensureStudyTimerInterval();
  renderStudyPlan();
}

function toggleStudyTimer() {
  const timer = studyPlan.activeTimer;
  if (!timer) return;
  if (timer.running) {
    timer.remainingSeconds = currentTimerRemaining();
    timer.running = false;
  } else {
    timer.running = true;
  }
  timer.updatedAt = new Date().toISOString();
  persistStudyPlan();
  ensureStudyTimerInterval();
  renderStudyTimer();
}

function generatedPlanTopics() {
  const ordered = [
    ...notebookEntries.filter((entry) => isReviewDue(entry)),
    ...notebookEntries,
  ];
  const seen = new Set();
  const topics = [];
  for (const entry of ordered) {
    const key = normalizeSearch(entry.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    topics.push(entry.title);
  }
  return topics.length ? topics : [t("Estudo livre de matemática")];
}

function generateStudyWeek() {
  const selectedDays = [...document.querySelectorAll('input[name="study-day"]:checked')]
    .map((input) => Number(input.value));
  if (selectedDays.length === 0) {
    window.alert(t("Selecione pelo menos um dia de estudo."));
    return;
  }
  const minutes = Math.max(5, Math.min(Number(planDefaultMinutes.value) || 45, 240));
  studyPlan.settings = { days: selectedDays, minutes };
  const topics = generatedPlanTopics();
  const start = startOfPlanWeek();
  let topicIndex = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    if (!selectedDays.includes(date.getDay())) continue;
    const dateKey = planDateKey(date);
    if (studyPlan.tasks.some((task) => task.date === dateKey && task.generated)) continue;
    const topic = topics[topicIndex % topics.length];
    const due = notebookEntries.some(
      (entry) => normalizeSearch(entry.title) === normalizeSearch(topic) && isReviewDue(entry),
    );
    studyPlan.tasks.push({
      id: newNotebookId(),
      title: `${t(due ? "Revisar" : "Estudar")}: ${topic}`,
      date: dateKey,
      minutes,
      done: false,
      generated: true,
    });
    topicIndex += 1;
  }
  persistStudyPlan();
  renderStudyPlan();
}

function renderStudyPlan() {
  const start = startOfPlanWeek();
  const dates = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    return date;
  });
  const startKey = planDateKey(dates[0]);
  const endKey = planDateKey(dates[6]);
  const weekTasks = studyPlan.tasks.filter((task) => task.date >= startKey && task.date <= endKey);
  const weekSessions = studyPlan.sessions.filter(
    (session) => session.date >= startKey && session.date <= endKey,
  );
  const planned = weekTasks.reduce((sum, task) => sum + (Number(task.minutes) || 0), 0);
  const studiedSeconds = weekSessions.reduce((sum, session) => sum + session.seconds, 0);
  const studied = Math.round(studiedSeconds / 60);
  const completed = weekTasks.filter((task) => task.done).length;
  const percent = planned ? Math.min(100, Math.round((studied / planned) * 100)) : 0;
  planPlanned.textContent = String(planned);
  planStudied.textContent = String(studied);
  planCompleted.textContent = `${completed}/${weekTasks.length}`;
  planPercent.textContent = `${percent}%`;
  planProgress.value = percent;
  planProgress.textContent = `${percent}%`;
  planWeekLabel.textContent = `${new Intl.DateTimeFormat(getLocale(), { day: "2-digit", month: "short" }).format(dates[0])} – ${new Intl.DateTimeFormat(getLocale(), { day: "2-digit", month: "short", year: "numeric" }).format(dates[6])}`;

  const today = planDateKey();
  const todayPending = studyPlan.tasks.filter((task) => task.date === today && !task.done).length;
  planOpen.textContent = todayPending ? `Plano (${todayPending})` : "Plano";
  planCalendar.replaceChildren();

  for (const date of dates) {
    const dateKey = planDateKey(date);
    const day = document.createElement("article");
    day.className = "plan-day";
    day.classList.toggle("today", dateKey === today);
    const heading = document.createElement("header");
    const weekday = document.createElement("strong");
    weekday.textContent = new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(date).replace(".", "");
    const dayNumber = document.createElement("span");
    dayNumber.textContent = new Intl.DateTimeFormat(getLocale(), { day: "2-digit", month: "2-digit" }).format(date);
    heading.append(weekday, dayNumber);
    day.append(heading);

    const tasks = weekTasks.filter((task) => task.date === dateKey);
    if (tasks.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Sem metas";
      day.append(empty);
    }
    for (const task of tasks) {
      const taskCard = document.createElement("section");
      taskCard.className = "plan-task";
      taskCard.classList.toggle("done", Boolean(task.done));
      const title = document.createElement("b");
      title.textContent = task.title;
      const duration = document.createElement("small");
      duration.textContent = `${task.minutes} min`;
      const actions = document.createElement("div");
      const startButton = document.createElement("button");
      startButton.type = "button";
      startButton.textContent = studyPlan.activeTimer?.taskId === task.id ? "Em andamento" : "Iniciar";
      startButton.disabled = studyPlan.activeTimer?.taskId === task.id;
      startButton.addEventListener("click", () => startStudyTask(task));
      const doneButton = document.createElement("button");
      doneButton.type = "button";
      doneButton.textContent = task.done ? "Concluída ✓" : "Concluir";
      doneButton.addEventListener("click", () => {
        task.done = !task.done;
        persistStudyPlan();
        renderStudyPlan();
      });
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `Excluir meta ${task.title}`);
      removeButton.addEventListener("click", () => {
        if (!window.confirm(getLanguage() === "es" ? `¿Eliminar la meta "${task.title}"?` : `Excluir a meta "${task.title}"?`)) return;
        studyPlan.tasks = studyPlan.tasks.filter((candidate) => candidate.id !== task.id);
        if (studyPlan.activeTimer?.taskId === task.id) studyPlan.activeTimer = null;
        persistStudyPlan();
        renderStudyPlan();
      });
      actions.append(startButton, doneButton, removeButton);
      taskCard.append(title, duration, actions);
      day.append(taskCard);
    }
    planCalendar.append(day);
  }
  renderStudyTimer();
}

function normalizeSearch(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function filteredCatalog() {
  if (!catalogBooks) return [];
  const query = normalizeSearch(catalogQuery.value);
  const category = catalogCategory.value;
  return catalogBooks.filter((book) => {
    if (category && book.category !== category) return false;
    if (catalogIndexed.checked && !book.indexed) return false;
    return !query || normalizeSearch(`${book.title} ${book.category}`).includes(query);
  });
}

function selectCatalogBook(book) {
  if (!book.indexed) return;
  catalogDialog.close();
  setMode("ask");
  input.value = getLanguage() === "es"
    ? `Usando el documento "${book.filename}", explica los conceptos principales y sugiere una secuencia de estudio.`
    : `Usando o documento "${book.filename}", explique os conceitos principais e sugira uma sequência de estudo.`;
  resizeInput();
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function renderCatalog() {
  if (!catalogBooks) return;
  const matches = filteredCatalog();
  const visible = matches.slice(0, catalogVisible);
  catalogResults.replaceChildren();
  catalogCount.textContent = `${matches.length} ${matches.length === 1 ? "título encontrado" : "títulos encontrados"}`;

  if (visible.length === 0) {
    const empty = document.createElement("p");
    empty.className = "catalog-empty";
    empty.textContent = "Nenhum título corresponde a esses filtros.";
    catalogResults.append(empty);
  }

  for (const book of visible) {
    const card = document.createElement("article");
    card.className = "catalog-card";
    card.classList.toggle("indexed", book.indexed);
    card.classList.toggle("queued", catalogQueue.has(book.filename));

    const meta = document.createElement("div");
    meta.className = "catalog-card-meta";
    const category = document.createElement("span");
    category.textContent = book.category;
    meta.append(category);
    if (book.indexed || catalogQueue.has(book.filename)) {
      const status = document.createElement("strong");
      status.textContent = book.indexed ? "Indexado" : "Na fila";
      meta.append(status);
    }

    const title = document.createElement("h3");
    title.textContent = book.title;
    title.title = book.filename;

    const action = document.createElement("button");
    action.type = "button";
    if (book.indexed) {
      action.textContent = "Perguntar sobre este livro";
      action.addEventListener("click", () => selectCatalogBook(book));
    } else {
      const queued = catalogQueue.has(book.filename);
      action.textContent = queued ? "Remover da fila" : "Adicionar à fila";
      action.disabled = !queued && catalogQueue.size >= QUEUE_LIMIT;
      action.addEventListener("click", () => toggleQueuedBook(book));
    }

    card.append(meta, title, action);
    catalogResults.append(card);
  }

  catalogMore.hidden = visible.length >= matches.length;
}

async function loadCatalog() {
  if (catalogBooks) {
    renderCatalog();
    return;
  }
  catalogCount.textContent = "Carregando catálogo…";
  try {
    const response = await fetch("/catalog.json");
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!Array.isArray(data.books)) throw new Error();
    catalogBooks = data.books;
    const queueable = new Set(
      catalogBooks.filter((book) => !book.indexed).map((book) => book.filename),
    );
    for (const filename of catalogQueue) {
      if (!queueable.has(filename)) catalogQueue.delete(filename);
    }
    saveQueue();
    renderQueue();
    renderCatalog();
  } catch {
    catalogCount.textContent = "Não foi possível carregar o catálogo.";
    catalogResults.replaceChildren();
    catalogMore.hidden = true;
  }
}

function resizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
}

function getMessageList() {
  let list = conversation.querySelector(".message-list");
  if (!list) {
    conversation.replaceChildren();
    list = document.createElement("section");
    list.className = "message-list";
    conversation.append(list);
  }
  return list;
}

function createMessage(role, text = "") {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "Você" : "Biblioteca";

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = text;

  article.append(label, content);
  getMessageList().append(article);
  article.scrollIntoView({ behavior: "smooth", block: "end" });
  return { article, content };
}

function cleanSourceName(key) {
  const name = key.split("/").at(-1) || key;
  return name.replace(/\.[^.]+$/, "");
}

function findPage(chunk) {
  const metadata = chunk?.item?.metadata;
  if (!metadata || typeof metadata !== "object") return null;
  for (const key of ["page", "page_number", "pageNumber"]) {
    const value = metadata[key];
    if (typeof value === "number" || (typeof value === "string" && value.trim())) {
      return String(value);
    }
  }
  return null;
}

function cleanExcerpt(text) {
  if (typeof text !== "string") return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 360 ? `${clean.slice(0, 357)}…` : clean;
}

function collectSources(chunks) {
  const unique = new Map();
  for (const chunk of chunks) {
    const key = chunk?.item?.key;
    if (typeof key !== "string") continue;
    const score = typeof chunk.score === "number" ? chunk.score : null;
    const existing = unique.get(key);
    if (!existing || (score !== null && (existing.score === null || score > existing.score))) {
      unique.set(key, {
        score,
        page: findPage(chunk),
        excerpt: cleanExcerpt(chunk.text),
      });
    }
  }
  return [...unique].map(([key, details]) => ({ key, name: cleanSourceName(key), ...details }));
}

function renderSources(article, chunks) {
  const unique = collectSources(chunks);
  if (unique.length === 0) return;

  const sources = document.createElement("section");
  sources.className = "sources";
  sources.setAttribute("aria-label", "Fontes recuperadas");

  const heading = document.createElement("div");
  heading.className = "sources-heading";
  const title = document.createElement("strong");
  title.textContent = `Fontes recuperadas (${unique.length})`;
  const note = document.createElement("small");
  note.textContent = "Similaridade indica recuperação, não garante que toda a resposta esteja na fonte.";
  heading.append(title, note);
  sources.append(heading);

  for (const details of unique) {
    const source = document.createElement("details");
    source.className = "source-card";
    const summary = document.createElement("summary");
    const name = document.createElement("b");
    name.textContent = details.name;
    summary.append(name);
    if (details.page !== null) {
      const page = document.createElement("span");
      page.textContent = `p. ${details.page}`;
      summary.append(page);
    }
    if (details.score !== null) {
      const value = document.createElement("em");
      value.textContent = `${(details.score * 100).toFixed(1).replace(".", ",")}%`;
      value.title = `Score bruto: ${details.score.toFixed(3)}`;
      summary.append(value);
    }
    source.append(summary);
    if (details.excerpt) {
      const excerpt = document.createElement("p");
      excerpt.textContent = details.excerpt;
      source.append(excerpt);
    }
    sources.append(source);
  }
  article.append(sources);
}

function podcastPlainText(text) {
  return text
    .replace(/[*_#`]/g, "")
    .replace(/\$+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const VIDEO_SCENE_TYPES = new Set([
  "title", "equation", "square", "squareExpansion", "groups", "bars",
  "numberLine", "coordinate", "diagram", "table", "final",
]);

function shortText(value, fallback = "", limit = 180) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, limit) : fallback;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function stripVideoStoryboard(text) {
  return text
    .replace(/\n?VIDEOAULA_JSON\s*[\s\S]*?FIM_VIDEOAULA_JSON\s*/i, "\n")
    .trim();
}

function fallbackVideoStoryboard(text, fallbackTitle) {
  const clean = podcastPlainText(stripVideoStoryboard(text));
  if (/comandante|tropas?/iu.test(clean) && /quadrad/iu.test(clean) && /\b36\b/.test(clean) && /\b75\b/.test(clean)) {
    const side = (36 + 75 - 1) / 2;
    const total = side ** 2 + 36;
    return {
      title: "As tropas e o quadrado",
      scenes: [
        { type: "title", heading: "Como enxergar o problema?", caption: "Transforme as duas formações em áreas.", duration: 5 },
        { type: "square", heading: "Formação original", sideLabel: "n", remainder: 36, equation: "N = n² + 36", caption: "O quadrado usa n² homens e 36 ficam de fora.", duration: 7 },
        { type: "squareExpansion", heading: "Um homem a mais em cada lado", sideLabel: "n", equation: "n + n + 1 = 2n + 1", caption: "A nova borda tem duas faixas de n e um canto.", duration: 8 },
        { type: "bars", heading: "Quantos homens a nova borda exige?", bars: [{ label: "Sobram", value: 36 }, { label: "Ainda faltam", value: 75 }, { label: "Nova borda", value: 111 }], caption: "Os 36 que sobravam mais os 75 que faltam completam a borda.", duration: 7 },
        { type: "equation", heading: "Descobrindo o lado", steps: ["36 + 75 = 2n + 1", "111 = 2n + 1", "110 = 2n", `n = ${side}`], caption: "55 é o número de homens em cada lado, não o total.", duration: 8 },
        { type: "square", heading: "Calculando o total", sideLabel: String(side), remainder: 36, total, caption: `${side}² homens no quadrado e mais 36 que sobraram.`, duration: 7 },
        { type: "final", heading: "Resposta e verificação", result: `${total} homens`, verification: `${side + 1}² − 75 = ${total}`, caption: "A nova formação confirma o resultado.", duration: 7 },
      ],
    };
  }
  const equations = [...clean.matchAll(/(?:\d+|[a-z])(?:\s*[+\-×÷=²^()]\s*(?:\d+|[a-z])){1,}/giu)]
    .map((match) => match[0].trim())
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 5);
  return {
    title: shortText(fallbackTitle, "Videoaula matemática", 70),
    scenes: [
      { type: "title", heading: shortText(fallbackTitle, "Videoaula matemática", 80), caption: "Observe a ideia antes de calcular.", duration: 5 },
      { type: "equation", heading: "Raciocínio passo a passo", steps: equations.length ? equations : ["Identifique os dados", "Relacione as grandezas", "Verifique o resultado"], duration: 9 },
      { type: "final", heading: "Conclusão", result: shortText(clean.match(/Resposta final:\s*([^.!?\n]+)/iu)?.[1], "Resultado verificado", 80), duration: 6 },
    ],
  };
}

function parseVideoStoryboard(text, fallbackTitle) {
  const match = text.match(/VIDEOAULA_JSON\s*([\s\S]*?)\s*FIM_VIDEOAULA_JSON/i);
  if (!match) return fallbackVideoStoryboard(text, fallbackTitle);
  try {
    const parsed = JSON.parse(match[1]);
    if (!parsed || !Array.isArray(parsed.scenes)) throw new Error("invalid storyboard");
    const scenes = parsed.scenes.slice(0, 10).map((candidate) => {
      const scene = candidate && typeof candidate === "object" ? candidate : {};
      const type = VIDEO_SCENE_TYPES.has(scene.type) ? scene.type : "equation";
      return {
        ...scene,
        type,
        heading: shortText(scene.heading, "Ideia matemática", 80),
        caption: shortText(scene.caption, "", 150),
        equation: shortText(scene.equation, "", 100),
        result: shortText(scene.result, "", 100),
        verification: shortText(scene.verification, "", 120),
        sideLabel: shortText(scene.sideLabel, "n", 12),
        duration: Math.max(3, Math.min(12, finiteNumber(scene.duration, 6))),
        steps: Array.isArray(scene.steps) ? scene.steps.slice(0, 6).map((step) => shortText(step, "", 100)).filter(Boolean) : [],
      };
    }).filter(Boolean);
    if (scenes.length < 2) throw new Error("short storyboard");
    return { title: shortText(parsed.title, fallbackTitle, 70), scenes };
  } catch {
    return fallbackVideoStoryboard(text, fallbackTitle);
  }
}

function wrapCanvasText(context, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && context.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 7);
}

function canvasRoundRect(context, x, y, width, height, radius = 16) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawCenteredText(context, text, x, y, maxWidth, lineHeight = 34, maxLines = 3) {
  const lines = wrapCanvasText(context, shortText(text, "", 300), maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
}

function drawDot(context, x, y, color = "#f2cb69", radius = 6) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function drawSceneTitle(context, scene) {
  context.fillStyle = "#f3f7f4";
  context.font = "700 28px system-ui, sans-serif";
  context.textAlign = "center";
  drawCenteredText(context, scene.heading || "Ideia matemática", context.canvas.width / 2, 128, 720, 34, 2);
  context.textAlign = "left";
}

function drawEquationScene(context, scene, localProgress) {
  const steps = scene.steps?.length ? scene.steps : [scene.equation || "Observe a relação entre as grandezas"];
  const visible = Math.max(1, Math.ceil(localProgress * steps.length));
  const startY = 190 - Math.min(steps.length, 5) * 3;
  steps.slice(0, visible).forEach((step, index) => {
    const y = startY + index * 48;
    context.fillStyle = index === visible - 1 ? "rgba(242, 203, 105, .18)" : "rgba(255, 255, 255, .07)";
    canvasRoundRect(context, 150, y - 30, 554, 39, 10);
    context.fill();
    context.fillStyle = index === visible - 1 ? "#f2cb69" : "#dce8e0";
    context.font = `${index === visible - 1 ? "700" : "600"} 22px system-ui, sans-serif`;
    context.textAlign = "center";
    context.fillText(shortText(step, "", 80), 427, y - 3);
  });
  context.textAlign = "left";
}

function drawSquareScene(context, scene, localProgress) {
  const x = 150;
  const y = 165;
  const size = 230;
  const grid = 10;
  context.fillStyle = "rgba(109, 210, 166, .13)";
  context.fillRect(x, y, size, size);
  context.strokeStyle = "#6dd2a6";
  context.lineWidth = 3;
  context.strokeRect(x, y, size, size);
  context.globalAlpha = .22;
  context.lineWidth = 1;
  for (let index = 1; index < grid; index += 1) {
    const offset = size * index / grid;
    context.beginPath(); context.moveTo(x + offset, y); context.lineTo(x + offset, y + size); context.stroke();
    context.beginPath(); context.moveTo(x, y + offset); context.lineTo(x + size, y + offset); context.stroke();
  }
  context.globalAlpha = 1;
  context.fillStyle = "#dce8e0";
  context.font = "700 22px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(`${scene.sideLabel || "n"} × ${scene.sideLabel || "n"}`, x + size / 2, y + size / 2 + 7);
  context.fillStyle = "#9fb5a8";
  context.font = "600 17px system-ui, sans-serif";
  context.fillText(scene.sideLabel || "n", x + size / 2, y + size + 27);
  context.fillText(scene.sideLabel || "n", x - 25, y + size / 2);

  const remainder = Math.max(0, Math.round(finiteNumber(scene.remainder, 0)));
  context.fillStyle = "rgba(242, 203, 105, .09)";
  canvasRoundRect(context, 465, 180, 235, 150, 18);
  context.fill();
  const dots = Math.min(remainder || 8, 24);
  const shown = Math.max(1, Math.ceil(dots * localProgress));
  for (let index = 0; index < shown; index += 1) {
    drawDot(context, 493 + (index % 8) * 25, 210 + Math.floor(index / 8) * 25, "#f2cb69", 5);
  }
  context.fillStyle = "#f2cb69";
  context.font = "700 24px system-ui, sans-serif";
  context.fillText(remainder ? `+ ${remainder} fora` : "grupo adicional", 582, 302);
  if (scene.total !== undefined) {
    context.fillStyle = "#dce8e0";
    context.font = "700 22px system-ui, sans-serif";
    context.fillText(`${scene.sideLabel || "n"}² + ${remainder} = ${finiteNumber(scene.total)}`, 582, 365);
  }
  context.textAlign = "left";
}

function drawSquareExpansionScene(context, scene, localProgress) {
  const x = 245;
  const y = 160;
  const base = 205;
  const strip = 38 * Math.min(1, localProgress * 1.8);
  context.fillStyle = "rgba(109, 210, 166, .18)";
  context.fillRect(x, y, base, base);
  context.strokeStyle = "#6dd2a6";
  context.lineWidth = 3;
  context.strokeRect(x, y, base, base);
  context.fillStyle = "rgba(242, 203, 105, .72)";
  context.fillRect(x + base, y, strip, base);
  context.fillRect(x, y + base, base, strip);
  context.fillStyle = "#ef8f6b";
  context.fillRect(x + base, y + base, strip, strip);
  context.fillStyle = "#dce8e0";
  context.font = "700 24px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(`${scene.sideLabel || "n"} × ${scene.sideLabel || "n"}`, x + base / 2, y + base / 2);
  context.fillStyle = "#f2cb69";
  context.font = "700 20px system-ui, sans-serif";
  context.fillText("+ n", x + base + 19, y + base / 2);
  context.fillText("+ n", x + base / 2, y + base + 29);
  context.fillStyle = "#ef8f6b";
  context.fillText("+ 1", x + base + 28, y + base + 29);
  context.fillStyle = "rgba(255, 255, 255, .08)";
  canvasRoundRect(context, 545, 210, 230, 95, 16);
  context.fill();
  context.fillStyle = "#f2cb69";
  context.font = "800 27px system-ui, sans-serif";
  context.fillText(scene.equation || "2n + 1", 660, 265);
  context.fillStyle = "#9fb5a8";
  context.font = "600 16px system-ui, sans-serif";
  context.fillText("nova borda", 660, 291);
  context.textAlign = "left";
}

function drawGroupsScene(context, scene, localProgress) {
  const groups = Array.isArray(scene.groups) ? scene.groups.slice(0, 4) : [];
  const safeGroups = groups.length ? groups : [{ label: "Grupo", count: 4 }];
  const width = 650 / safeGroups.length;
  safeGroups.forEach((group, groupIndex) => {
    const count = Math.max(0, Math.round(finiteNumber(group.count, 0)));
    const visible = Math.ceil(Math.min(count, 30) * localProgress);
    const centerX = 102 + width * groupIndex + width / 2;
    context.fillStyle = "rgba(255, 255, 255, .06)";
    canvasRoundRect(context, 92 + width * groupIndex, 170, width - 16, 205, 16);
    context.fill();
    for (let index = 0; index < visible; index += 1) {
      const cols = 5;
      drawDot(context, centerX - 40 + (index % cols) * 20, 215 + Math.floor(index / cols) * 21, groupIndex % 2 ? "#6dd2a6" : "#f2cb69", 5);
    }
    context.fillStyle = "#f3f7f4";
    context.font = "700 20px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(count > 30 ? `${count}` : `${count}`, centerX, 338);
    context.fillStyle = "#9fb5a8";
    context.font = "600 15px system-ui, sans-serif";
    context.fillText(shortText(group.label, "Grupo", 22), centerX, 362);
  });
  context.textAlign = "left";
}

function drawBarsScene(context, scene, localProgress) {
  const bars = Array.isArray(scene.bars) ? scene.bars.slice(0, 5) : [];
  const safeBars = bars.length ? bars : [{ label: "Valor", value: 1 }];
  const max = Math.max(...safeBars.map((bar) => Math.abs(finiteNumber(bar.value, 0))), 1);
  safeBars.forEach((bar, index) => {
    const value = finiteNumber(bar.value, 0);
    const y = 165 + index * 52;
    context.fillStyle = "#dce8e0";
    context.font = "600 16px system-ui, sans-serif";
    context.textAlign = "right";
    context.fillText(shortText(bar.label, `Valor ${index + 1}`, 24), 205, y + 22);
    context.fillStyle = "rgba(255, 255, 255, .08)";
    canvasRoundRect(context, 225, y, 480, 31, 8); context.fill();
    context.fillStyle = index % 2 ? "#6dd2a6" : "#f2cb69";
    canvasRoundRect(context, 225, y, Math.max(6, 480 * Math.abs(value) / max * localProgress), 31, 8); context.fill();
    context.fillStyle = "#10251c";
    context.font = "800 16px system-ui, sans-serif";
    context.textAlign = "left";
    context.fillText(String(value), 237, y + 22);
  });
  context.textAlign = "left";
}

function drawNumberLineScene(context, scene, localProgress) {
  const min = finiteNumber(scene.min, 0);
  const max = finiteNumber(scene.max, min + 10) || min + 10;
  const range = max === min ? 1 : max - min;
  const x1 = 120;
  const x2 = 735;
  const y = 275;
  context.strokeStyle = "#9fb5a8";
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(x1, y); context.lineTo(x2, y); context.stroke();
  for (let index = 0; index <= 10; index += 1) {
    const x = x1 + (x2 - x1) * index / 10;
    context.beginPath(); context.moveTo(x, y - 7); context.lineTo(x, y + 7); context.stroke();
  }
  const points = Array.isArray(scene.points) ? scene.points.slice(0, 8) : [];
  points.forEach((point, index) => {
    if (localProgress < (index + 1) / (points.length + 1)) return;
    const value = finiteNumber(point.value, min);
    const x = x1 + (x2 - x1) * (value - min) / range;
    drawDot(context, Math.max(x1, Math.min(x2, x)), y, index % 2 ? "#6dd2a6" : "#f2cb69", 9);
    context.fillStyle = "#f3f7f4";
    context.font = "700 16px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(shortText(point.label, String(value), 25), Math.max(x1, Math.min(x2, x)), y - 20);
  });
  context.fillStyle = "#9fb5a8";
  context.font = "600 15px system-ui, sans-serif";
  context.fillText(String(min), x1, y + 30);
  context.fillText(String(max), x2, y + 30);
  context.textAlign = "left";
}

function drawCoordinateScene(context, scene, localProgress) {
  const left = 170; const top = 155; const width = 520; const height = 235;
  context.strokeStyle = "rgba(255,255,255,.11)"; context.lineWidth = 1;
  for (let index = 0; index <= 10; index += 1) {
    const x = left + width * index / 10; const y = top + height * index / 10;
    context.beginPath(); context.moveTo(x, top); context.lineTo(x, top + height); context.stroke();
    context.beginPath(); context.moveTo(left, y); context.lineTo(left + width, y); context.stroke();
  }
  context.strokeStyle = "#9fb5a8"; context.lineWidth = 2;
  context.beginPath(); context.moveTo(left, top + height / 2); context.lineTo(left + width, top + height / 2); context.stroke();
  context.beginPath(); context.moveTo(left + width / 2, top); context.lineTo(left + width / 2, top + height); context.stroke();
  const points = Array.isArray(scene.points) ? scene.points.slice(0, 20) : [];
  const xs = points.map((point) => finiteNumber(point.x));
  const ys = points.map((point) => finiteNumber(point.y));
  const bound = Math.max(1, ...xs.map(Math.abs), ...ys.map(Math.abs));
  const pixel = (point) => ({ x: left + width / 2 + finiteNumber(point.x) / bound * width * .43, y: top + height / 2 - finiteNumber(point.y) / bound * height * .43 });
  const segments = Array.isArray(scene.segments) ? scene.segments.slice(0, 30) : [];
  context.strokeStyle = "#6dd2a6"; context.lineWidth = 3;
  segments.forEach((segment, index) => {
    if (!Array.isArray(segment) || localProgress < (index + 1) / (segments.length + 1)) return;
    const first = points[segment[0]]; const second = points[segment[1]];
    if (!first || !second) return;
    const a = pixel(first); const b = pixel(second);
    context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
  });
  points.forEach((point, index) => {
    if (localProgress < (index + 1) / (points.length + 1)) return;
    const position = pixel(point); drawDot(context, position.x, position.y, "#f2cb69", 7);
    context.fillStyle = "#f3f7f4"; context.font = "600 14px system-ui, sans-serif";
    context.fillText(shortText(point.label, `(${point.x}, ${point.y})`, 20), position.x + 9, position.y - 8);
  });
}

function drawDiagramScene(context, scene, localProgress) {
  const nodes = Array.isArray(scene.nodes) ? scene.nodes.slice(0, 10) : [];
  const edges = Array.isArray(scene.edges) ? scene.edges.slice(0, 15) : [];
  const positions = new Map(nodes.map((node, index) => [String(node.id ?? index), {
    x: 120 + Math.max(0, Math.min(1, finiteNumber(node.x, (index + 1) / (nodes.length + 1)))) * 615,
    y: 170 + Math.max(0, Math.min(1, finiteNumber(node.y, .5))) * 190,
  }]));
  context.strokeStyle = "#6dd2a6"; context.lineWidth = 3;
  edges.forEach((edge, index) => {
    if (localProgress < (index + 1) / (edges.length + 2)) return;
    const from = positions.get(String(edge.from)); const to = positions.get(String(edge.to));
    if (!from || !to) return;
    context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y); context.stroke();
    if (edge.label) {
      context.fillStyle = "#9fb5a8"; context.font = "600 13px system-ui, sans-serif"; context.textAlign = "center";
      context.fillText(shortText(edge.label, "", 22), (from.x + to.x) / 2, (from.y + to.y) / 2 - 7);
    }
  });
  nodes.forEach((node, index) => {
    if (localProgress < (index + 1) / (nodes.length + 2)) return;
    const position = positions.get(String(node.id ?? index));
    context.fillStyle = index % 2 ? "#173f2f" : "#403821";
    canvasRoundRect(context, position.x - 63, position.y - 27, 126, 54, 15); context.fill();
    context.strokeStyle = index % 2 ? "#6dd2a6" : "#f2cb69"; context.lineWidth = 2; context.stroke();
    context.fillStyle = "#f3f7f4"; context.font = "700 15px system-ui, sans-serif"; context.textAlign = "center";
    context.fillText(shortText(node.label, String(node.id ?? index), 18), position.x, position.y + 5);
  });
  context.textAlign = "left";
}

function drawTableScene(context, scene, localProgress) {
  const headers = Array.isArray(scene.headers) ? scene.headers.slice(0, 5).map((value) => shortText(value, "", 20)) : [];
  const rows = Array.isArray(scene.rows) ? scene.rows.slice(0, 5) : [];
  const columns = Math.max(1, headers.length || Math.max(1, ...rows.map((row) => Array.isArray(row) ? row.length : 0)));
  const x = 100; const y = 165; const width = 654; const rowHeight = 40; const columnWidth = width / columns;
  [...(headers.length ? [headers] : []), ...rows].forEach((row, rowIndex) => {
    if (localProgress < (rowIndex + 1) / (rows.length + 2)) return;
    for (let column = 0; column < columns; column += 1) {
      context.fillStyle = rowIndex === 0 && headers.length ? "rgba(242,203,105,.18)" : "rgba(255,255,255,.06)";
      context.fillRect(x + column * columnWidth, y + rowIndex * rowHeight, columnWidth, rowHeight);
      context.strokeStyle = "rgba(255,255,255,.15)"; context.strokeRect(x + column * columnWidth, y + rowIndex * rowHeight, columnWidth, rowHeight);
      context.fillStyle = rowIndex === 0 && headers.length ? "#f2cb69" : "#dce8e0";
      context.font = `${rowIndex === 0 && headers.length ? "700" : "600"} 15px system-ui, sans-serif`;
      context.textAlign = "center";
      context.fillText(shortText(Array.isArray(row) ? row[column] : "", "", 18), x + column * columnWidth + columnWidth / 2, y + rowIndex * rowHeight + 26);
    }
  });
  context.textAlign = "left";
}

function drawFinalScene(context, scene, localProgress) {
  const pulse = 1 + Math.sin(localProgress * Math.PI) * .04;
  context.save();
  context.translate(427, 270); context.scale(pulse, pulse);
  context.fillStyle = "rgba(242,203,105,.12)";
  canvasRoundRect(context, -265, -80, 530, 160, 24); context.fill();
  context.strokeStyle = "#f2cb69"; context.lineWidth = 3; context.stroke();
  context.fillStyle = "#f2cb69"; context.font = "800 38px system-ui, sans-serif"; context.textAlign = "center";
  context.fillText(shortText(scene.result, scene.equation || "Resultado", 42), 0, -8);
  context.fillStyle = "#dce8e0"; context.font = "700 21px system-ui, sans-serif";
  context.fillText(shortText(scene.verification, "Resultado verificado", 65), 0, 35);
  context.restore(); context.textAlign = "left";
}

function storyboardMoment(storyboard, elapsed, duration) {
  const weights = storyboard.scenes.map((scene) => Math.max(3, finiteNumber(scene.duration, 6)));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const position = duration ? elapsed / duration * totalWeight : 0;
  let consumed = 0;
  for (let index = 0; index < weights.length; index += 1) {
    if (position <= consumed + weights[index] || index === weights.length - 1) {
      return { index, localProgress: Math.max(0, Math.min(1, (position - consumed) / weights[index])) };
    }
    consumed += weights[index];
  }
  return { index: storyboard.scenes.length - 1, localProgress: 1 };
}

function drawPodcastFrame(context, storyboard, progress, elapsed, duration) {
  const { width, height } = context.canvas;
  const moment = storyboardMoment(storyboard, elapsed, duration);
  const scene = storyboard.scenes[moment.index];
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0b2118");
  gradient.addColorStop(1, "#16382a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#f2cb69";
  context.font = "700 24px system-ui, sans-serif";
  context.fillText("∑ PLAYGROUND MATEMÁTICO", 48, 55);
  context.fillStyle = "#9fb5a8";
  context.font = "500 18px system-ui, sans-serif";
  context.fillText(storyboard.title.slice(0, 70), 48, 88);

  drawSceneTitle(context, scene);
  if (scene.type === "title") drawDiagramScene(context, { nodes: [{ id: "question", label: "Problema", x: .18, y: .55 }, { id: "model", label: "Modelo visual", x: .5, y: .35 }, { id: "answer", label: "Resposta", x: .82, y: .55 }], edges: [{ from: "question", to: "model" }, { from: "model", to: "answer" }] }, moment.localProgress);
  else if (scene.type === "square") drawSquareScene(context, scene, moment.localProgress);
  else if (scene.type === "squareExpansion") drawSquareExpansionScene(context, scene, moment.localProgress);
  else if (scene.type === "groups") drawGroupsScene(context, scene, moment.localProgress);
  else if (scene.type === "bars") drawBarsScene(context, scene, moment.localProgress);
  else if (scene.type === "numberLine") drawNumberLineScene(context, scene, moment.localProgress);
  else if (scene.type === "coordinate") drawCoordinateScene(context, scene, moment.localProgress);
  else if (scene.type === "diagram") drawDiagramScene(context, scene, moment.localProgress);
  else if (scene.type === "table") drawTableScene(context, scene, moment.localProgress);
  else if (scene.type === "final") drawFinalScene(context, scene, moment.localProgress);
  else drawEquationScene(context, scene, moment.localProgress);

  if (scene.caption) {
    context.fillStyle = "rgba(7, 22, 15, .86)";
    canvasRoundRect(context, 110, 398, 634, 34, 10); context.fill();
    context.fillStyle = "#dce8e0"; context.font = "600 15px system-ui, sans-serif"; context.textAlign = "center";
    context.fillText(shortText(scene.caption, "", 92), width / 2, 421);
    context.textAlign = "left";
  }

  const barX = 48;
  const barY = height - 48;
  const barWidth = width - 96;
  context.fillStyle = "rgba(255, 255, 255, .14)";
  context.fillRect(barX, barY, barWidth, 7);
  context.fillStyle = "#f2cb69";
  context.fillRect(barX, barY, barWidth * progress, 7);
  context.fillStyle = "#c8d3cb";
  context.font = "500 15px system-ui, sans-serif";
  const seconds = Math.max(0, Math.ceil(duration - elapsed));
  context.fillText(`${moment.index + 1}/${storyboard.scenes.length}  ·  ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`, barX, barY - 14);
}

function podcastAudioChunks(text, maxLength = 1_800) {
  const clean = podcastPlainText(text);
  if (clean.length <= maxLength) return [clean];

  const chunks = [];
  let remaining = clean;
  while (remaining.length > maxLength) {
    const window = remaining.slice(0, maxLength + 1);
    const sentenceCut = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("! "),
      window.lastIndexOf("? "),
      window.lastIndexOf("; "),
    );
    const wordCut = window.lastIndexOf(" ");
    const cut = sentenceCut >= Math.floor(maxLength * 0.55)
      ? sentenceCut + 1
      : wordCut > 0 ? wordCut : maxLength;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function requestPodcastAudioChunk(text) {
  const response = await fetch("/api/podcast/audio", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, language: getLanguage() }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(t(data?.error || "Não foi possível gerar o áudio do podcast agora."));
  }
  if (response.headers.get("x-playground-audio-encoding") === "base64") {
    const base64 = (await response.text()).trim();
    if (!base64) throw new Error(t("Não foi possível gerar o áudio do podcast agora."));
    const audioType = response.headers.get("x-playground-audio-type") || "audio/mpeg";
    let bytes;
    if (typeof Uint8Array.fromBase64 === "function") {
      bytes = Uint8Array.fromBase64(base64);
    } else {
      const binary = atob(base64);
      bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
    }
    return new Blob([bytes], { type: audioType });
  }
  return response.blob();
}

async function requestPodcastAudio(text) {
  const chunks = podcastAudioChunks(text);
  const audioParts = [];
  for (const chunk of chunks) {
    audioParts.push(await requestPodcastAudioChunk(chunk));
  }
  return new Blob(audioParts, { type: audioParts[0]?.type || "audio/mpeg" });
}

async function createPodcastVideo(audioBlob, storyboard, onProgress) {
  if (!("MediaRecorder" in window)) {
    throw new Error(t("Este navegador não consegue gerar o vídeo."));
  }

  const canvas = document.createElement("canvas");
  canvas.width = 854;
  canvas.height = 480;
  const context = canvas.getContext("2d");
  if (!context || typeof canvas.captureStream !== "function") {
    throw new Error(t("Este navegador não consegue gerar o vídeo."));
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioContext = null;
  let audioBuffer = null;
  let destination = null;
  let source = null;
  if (audioBlob) {
    if (!AudioContextClass) throw new Error(t("Este navegador não consegue usar o áudio escolhido."));
    audioContext = new AudioContextClass();
    audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
    destination = audioContext.createMediaStreamDestination();
    source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(destination);
    source.connect(audioContext.destination);
  }

  const canvasStream = canvas.captureStream(15);
  const stream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...(destination?.stream.getAudioTracks() || []),
  ]);
  const mimeTypes = audioBlob
    ? ["video/webm;codecs=vp8,opus", "video/webm", "video/webm;codecs=vp9,opus", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4"]
    : ["video/webm;codecs=vp8", "video/webm", "video/webm;codecs=vp9", "video/mp4;codecs=avc1.42E01E", "video/mp4"];
  const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) {
    stream.getTracks().forEach((track) => track.stop());
    await audioContext?.close();
    throw new Error(t("Este navegador não consegue gerar o vídeo."));
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 1_200_000,
    audioBitsPerSecond: 96_000,
  });
  const chunks = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });

  const plannedDuration = storyboard.scenes.reduce((sum, scene) => sum + Math.max(3, finiteNumber(scene.duration, 6)), 0);
  const duration = audioBuffer?.duration || Math.max(15, Math.min(90, plannedDuration));
  let animationFrame = 0;
  let startedAt = 0;
  const draw = () => {
    const clock = audioContext ? audioContext.currentTime : performance.now() / 1_000;
    const elapsed = Math.min(duration, clock - startedAt);
    const progress = duration ? elapsed / duration : 0;
    drawPodcastFrame(context, storyboard, progress, elapsed, duration);
    onProgress(progress);
    if (recorder.state === "recording" && elapsed < duration) {
      animationFrame = window.requestAnimationFrame(draw);
    } else if (recorder.state === "recording" && !audioBlob) {
      recorder.stop();
    }
  };

  const finished = new Promise((resolve, reject) => {
    recorder.addEventListener("stop", () => resolve(new Blob(chunks, { type: mimeType })), { once: true });
    recorder.addEventListener("error", () => reject(new Error(t("Não foi possível montar o vídeo."))), { once: true });
  });

  drawPodcastFrame(context, storyboard, 0, 0, duration);
  recorder.start(1_000);
  if (audioContext && source) {
    await audioContext.resume();
    startedAt = audioContext.currentTime;
    source.addEventListener("ended", () => {
      if (recorder.state === "recording") recorder.stop();
    }, { once: true });
    source.start();
  } else {
    startedAt = performance.now() / 1_000;
  }
  animationFrame = window.requestAnimationFrame(draw);

  try {
    return await finished;
  } finally {
    window.cancelAnimationFrame(animationFrame);
    stream.getTracks().forEach((track) => track.stop());
    await audioContext?.close();
  }
}

function renderAudioControls(article, text, topic, storyboard) {
  const controls = document.createElement("div");
  controls.className = "audio-controls";
  const play = document.createElement("button");
  play.type = "button";
  play.textContent = "▶ Ouvir roteiro";
  play.disabled = !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window);
  const stop = document.createElement("button");
  stop.type = "button";
  stop.textContent = "■ Parar";
  stop.disabled = true;
  const generateAudio = document.createElement("button");
  generateAudio.type = "button";
  generateAudio.textContent = "↓ Gerar áudio";
  const generateVideo = document.createElement("button");
  generateVideo.type = "button";
  generateVideo.textContent = "🎬 Gerar videoaula";
  const chooseAudio = document.createElement("button");
  chooseAudio.type = "button";
  chooseAudio.textContent = "🎙️ Usar áudio próprio";
  const audioInput = document.createElement("input");
  audioInput.type = "file";
  audioInput.accept = "audio/*";
  audioInput.hidden = true;
  const status = document.createElement("small");
  status.className = "podcast-status";
  status.setAttribute("aria-live", "polite");
  let audioBlob = null;
  let audioUrl = null;
  let selectedAudioBlob = null;

  const ensureAudio = async () => {
    if (audioBlob) return audioBlob;
    generateAudio.disabled = true;
    generateVideo.disabled = true;
    status.textContent = t("Gerando narração…");
    try {
      audioBlob = await requestPodcastAudio(text);
      audioUrl = URL.createObjectURL(audioBlob);
      const player = document.createElement("audio");
      player.controls = true;
      player.preload = "metadata";
      player.src = audioUrl;
      player.className = "podcast-player";
      const download = document.createElement("a");
      download.href = audioUrl;
      download.download = "podcast-playground.mp3";
      download.className = "podcast-download";
      download.textContent = t("Baixar MP3");
      controls.after(player, download);
      status.textContent = t("Áudio pronto.");
      return audioBlob;
    } finally {
      generateAudio.disabled = Boolean(audioBlob);
      generateVideo.disabled = false;
    }
  };

  const reset = () => {
    play.disabled = false;
    stop.disabled = true;
    if (activeSpeech?.controls === controls) activeSpeech = null;
  };

  play.addEventListener("click", () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    window.speechSynthesis.cancel();
    const spokenText = podcastPlainText(text);
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = getLocale();
    utterance.rate = 1;
    const voice = window.speechSynthesis
      .getVoices()
      .find((candidate) => candidate.lang.toLowerCase().startsWith(getLanguage() === "es" ? "es" : "pt-br"));
    if (voice) utterance.voice = voice;
    utterance.addEventListener("end", reset, { once: true });
    utterance.addEventListener("error", reset, { once: true });
    activeSpeech = { utterance, controls };
    play.disabled = true;
    stop.disabled = false;
    window.speechSynthesis.speak(utterance);
  });

  stop.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    reset();
  });

  generateAudio.addEventListener("click", async () => {
    try {
      await ensureAudio();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : t("Não foi possível gerar o áudio do podcast agora.");
      generateAudio.disabled = false;
    }
  });

  chooseAudio.addEventListener("click", () => audioInput.click());
  audioInput.addEventListener("change", () => {
    const file = audioInput.files?.[0];
    if (!file) return;
    selectedAudioBlob = file;
    chooseAudio.textContent = `🎙️ ${shortText(file.name, t("Áudio escolhido"), 28)}`;
    status.textContent = t("Áudio próprio escolhido. Ele será usado na videoaula.");
  });

  generateVideo.addEventListener("click", async () => {
    try {
      window.speechSynthesis?.cancel();
      generateAudio.disabled = true;
      generateVideo.disabled = true;
      chooseAudio.disabled = true;
      const videoAudio = selectedAudioBlob || audioBlob;
      status.textContent = videoAudio
        ? t("Montando videoaula com seu áudio… mantenha esta tela aberta.")
        : t("Montando videoaula sem áudio… mantenha esta tela aberta.");
      const video = await createPodcastVideo(videoAudio, storyboard, (progress) => {
        status.textContent = `${t("Montando videoaula… mantenha esta tela aberta.")} ${Math.round(progress * 100)}%`;
      });
      const videoUrl = URL.createObjectURL(video);
      const download = document.createElement("a");
      download.href = videoUrl;
      download.download = `videoaula-playground.${video.type.startsWith("video/mp4") ? "mp4" : "webm"}`;
      download.className = "podcast-download video-download";
      download.textContent = t("Baixar videoaula");
      controls.after(download);
      status.textContent = t("Videoaula pronta.");
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : t("Não foi possível montar o vídeo.");
    } finally {
      generateAudio.disabled = Boolean(audioBlob);
      generateVideo.disabled = false;
      chooseAudio.disabled = false;
    }
  });

  controls.append(play, stop, generateAudio, chooseAudio, audioInput, generateVideo, status);
  article.append(controls);
}

function parseMindMap(text, fallbackTitle) {
  const allLines = text.replace(/\t/g, "  ").split("\n");
  const start = allLines.findIndex((line) => /^\s*MAPA MENTAL\s*:?\s*$/i.test(line));
  const end = allLines.findIndex(
    (line, index) => index > start && /^\s*FIM DO MAPA\s*\.?\s*$/i.test(line),
  );
  const lines = start >= 0 ? allLines.slice(start + 1, end > start ? end : undefined) : allLines;
  const entries = lines
    .map((line) => {
      const match = line.match(/^(\s*)[-•]\s+(.+?)\s*$/);
      if (!match) return null;
      const label = match[2].replace(/[*_#`]/g, "").trim();
      return label ? { rawDepth: Math.floor(match[1].length / 2), label } : null;
    })
    .filter(Boolean)
    .slice(0, 24);

  const rootLabel = entries[0]?.label || fallbackTitle;
  const root = { id: 0, label: rootLabel, depth: 0, parent: null, children: [] };
  const nodes = [root];
  const stack = [root];

  for (const entry of entries.slice(1)) {
    const depth = Math.max(1, Math.min(entry.rawDepth, 4));
    while (stack.length > depth) stack.pop();
    const parent = stack[depth - 1] || root;
    const node = {
      id: nodes.length,
      label: entry.label,
      depth: parent.depth + 1,
      parent,
      children: [],
    };
    parent.children.push(node);
    nodes.push(node);
    stack[node.depth] = node;
    stack.length = node.depth + 1;
  }

  return nodes.length > 1 ? { root, nodes } : null;
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

function wrapLabel(label, limit = 24) {
  const words = label.split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const current = lines.at(-1);
    if (current && `${current} ${word}`.length > limit && lines.length < 2) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = current ? `${current} ${word}` : word;
    }
  }
  if (lines[1]?.length > limit + 8) lines[1] = `${lines[1].slice(0, limit + 5)}…`;
  return lines;
}

function renderMindMap(article, text, fallbackTitle) {
  const tree = parseMindMap(text, fallbackTitle);
  if (!tree) return;

  let leafIndex = 0;
  const setPositions = (node) => {
    if (node.children.length === 0) {
      node.y = 60 + leafIndex * 82;
      leafIndex += 1;
    } else {
      node.children.forEach(setPositions);
      node.y = node.children.reduce((sum, child) => sum + child.y, 0) / node.children.length;
    }
    node.x = 30 + node.depth * 235;
  };
  setPositions(tree.root);

  const maxDepth = Math.max(...tree.nodes.map((node) => node.depth));
  const width = Math.max(720, 60 + (maxDepth + 1) * 235);
  const height = Math.max(320, 120 + Math.max(1, leafIndex - 1) * 82);
  const svg = svgElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    role: "img",
    "aria-label": `Mapa mental sobre ${fallbackTitle}`,
  });
  svg.classList.add("mindmap-svg");
  svg.append(svgElement("rect", { width, height, rx: 20, fill: "#0f2119" }));

  for (const node of tree.nodes.slice(1)) {
    const parent = node.parent;
    const path = svgElement("path", {
      d: `M ${parent.x + 190} ${parent.y} C ${parent.x + 212} ${parent.y}, ${node.x - 22} ${node.y}, ${node.x} ${node.y}`,
      fill: "none",
      stroke: "#927f47",
      "stroke-width": 2,
      opacity: 0.72,
    });
    svg.append(path);
  }

  for (const node of tree.nodes) {
    const group = svgElement("g", { transform: `translate(${node.x} ${node.y - 27})` });
    const isRoot = node.depth === 0;
    group.append(
      svgElement("rect", {
        width: 190,
        height: 54,
        rx: 12,
        fill: isRoot ? "#f2cb69" : node.depth === 1 ? "#234c39" : "#173126",
        stroke: isRoot ? "#f2cb69" : "#456d59",
        "stroke-width": 1.5,
      }),
    );
    const title = svgElement("title");
    title.textContent = node.label;
    group.append(title);
    const label = svgElement("text", {
      x: 95,
      y: 23,
      fill: isRoot ? "#132219" : "#f7f7ef",
      "font-family": "Inter, system-ui, sans-serif",
      "font-size": isRoot ? 13 : 12,
      "font-weight": isRoot ? 800 : 650,
      "text-anchor": "middle",
    });
    wrapLabel(node.label).forEach((line, index) => {
      const span = svgElement("tspan", { x: 95, dy: index === 0 ? 0 : 16 });
      span.textContent = line;
      label.append(span);
    });
    group.append(label);
    svg.append(group);
  }

  const panel = document.createElement("section");
  panel.className = "mindmap-panel";
  const toolbar = document.createElement("div");
  toolbar.className = "mindmap-toolbar";
  const heading = document.createElement("strong");
  heading.textContent = "Mapa mental gráfico";
  const actions = document.createElement("div");
  const zoomOut = document.createElement("button");
  zoomOut.type = "button";
  zoomOut.textContent = "−";
  zoomOut.setAttribute("aria-label", "Diminuir mapa");
  const zoomIn = document.createElement("button");
  zoomIn.type = "button";
  zoomIn.textContent = "+";
  zoomIn.setAttribute("aria-label", "Ampliar mapa");
  const download = document.createElement("button");
  download.type = "button";
  download.textContent = "Preparando PNG…";
  download.disabled = true;
  const openImage = document.createElement("button");
  openImage.type = "button";
  openImage.textContent = "Abrir PNG";
  openImage.disabled = true;
  actions.append(zoomOut, zoomIn, download, openImage);
  toolbar.append(heading, actions);

  const viewport = document.createElement("div");
  viewport.className = "mindmap-viewport";
  viewport.append(svg);
  let zoom = 1;
  const applyZoom = () => {
    svg.style.width = `${Math.round(width * zoom)}px`;
    svg.style.height = `${Math.round(height * zoom)}px`;
  };
  zoomOut.addEventListener("click", () => {
    zoom = Math.max(0.65, zoom - 0.15);
    applyZoom();
  });
  zoomIn.addEventListener("click", () => {
    zoom = Math.min(1.6, zoom + 0.15);
    applyZoom();
  });
  let pngUrl = null;
  const preparePng = () => {
    const serialized = new XMLSerializer().serializeToString(svg);
    const source = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const sourceUrl = URL.createObjectURL(source);
    const image = new Image();
    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(sourceUrl);
        download.textContent = "PNG indisponível";
        return;
      }
      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(sourceUrl);
      canvas.toBlob((blob) => {
        if (!blob) {
          download.textContent = "PNG indisponível";
          return;
        }
        pngUrl = URL.createObjectURL(blob);
        download.textContent = "Baixar PNG";
        download.disabled = false;
        openImage.disabled = false;
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      download.textContent = "PNG indisponível";
    };
    image.src = sourceUrl;
  };
  download.addEventListener("click", () => {
    if (!pngUrl) return;
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "mapa-mental.png";
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
  });
  openImage.addEventListener("click", () => {
    if (pngUrl) window.open(pngUrl, "_blank", "noopener");
  });
  applyZoom();
  panel.append(toolbar, viewport);
  article.append(panel);
  preparePng();
}

function parseExam(text) {
  const match = text.match(/SIMULADO_JSON\s*([\s\S]*?)\s*FIM_SIMULADO_JSON/i);
  if (!match) return null;
  const source = match[1].trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const data = JSON.parse(source);
    if (!data || !Array.isArray(data.questions) || data.questions.length !== 5) return null;
    const questions = data.questions.map((question) => {
      if (
        !question ||
        typeof question.question !== "string" ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        !question.options.every((option) => typeof option === "string") ||
        !Number.isInteger(question.correct) ||
        question.correct < 0 ||
        question.correct > 3
      ) {
        throw new Error("Questão inválida");
      }
      return {
        question: question.question,
        options: question.options,
        correct: question.correct,
        explanation: typeof question.explanation === "string" ? question.explanation : "",
        source: typeof question.source === "string" ? question.source : "",
      };
    });
    return { title: typeof data.title === "string" ? data.title : t("Simulado"), questions };
  } catch {
    return null;
  }
}

function setMathText(target, text) {
  target.textContent = text;
  renderMathIn(target);
}

function renderExam(article, content, text, fallbackTitle) {
  const exam = parseExam(text);
  if (!exam) return false;

  content.textContent = t("Simulado pronto. As respostas serão reveladas somente após a entrega.");
  const panel = document.createElement("section");
  panel.className = "exam-panel";
  const header = document.createElement("header");
  const heading = document.createElement("div");
  const eyebrow = document.createElement("small");
  eyebrow.textContent = "5 questões · 20 minutos";
  const title = document.createElement("h3");
  title.textContent = exam.title || fallbackTitle;
  heading.append(eyebrow, title);
  const timer = document.createElement("time");
  timer.setAttribute("aria-label", "Tempo restante");
  timer.textContent = "20:00";
  header.append(heading, timer);

  const progress = document.createElement("p");
  progress.className = "exam-progress";
  progress.textContent = "0 de 5 respondidas";
  const form = document.createElement("form");
  form.className = "exam-form";
  const fieldsets = [];
  const examId = newNotebookId();

  exam.questions.forEach((question, questionIndex) => {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    const number = document.createElement("b");
    number.textContent = `${questionIndex + 1}.`;
    const questionText = document.createElement("span");
    setMathText(questionText, question.question);
    legend.append(number, questionText);
    fieldset.append(legend);

    const options = document.createElement("div");
    options.className = "exam-options";
    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `exam-${examId}-${questionIndex}`;
      radio.value = String(optionIndex);
      const letter = document.createElement("b");
      letter.textContent = `${String.fromCharCode(65 + optionIndex)})`;
      const optionText = document.createElement("span");
      setMathText(optionText, option);
      label.append(radio, letter, optionText);
      options.append(label);
    });
    const feedback = document.createElement("div");
    feedback.className = "exam-feedback";
    feedback.hidden = true;
    fieldset.append(options, feedback);
    fieldsets.push({ fieldset, feedback, question });
    form.append(fieldset);
  });

  const footer = document.createElement("footer");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Entregar simulado";
  const result = document.createElement("strong");
  result.className = "exam-result";
  footer.append(result, submit);
  form.append(footer);
  panel.append(header, progress, form);
  article.append(panel);

  const updateProgress = () => {
    const answered = fieldsets.filter(({ fieldset }) => fieldset.querySelector("input:checked")).length;
    progress.textContent = `${answered} de ${fieldsets.length} respondidas`;
  };
  form.addEventListener("change", updateProgress);

  let remaining = 20 * 60;
  let submitted = false;
  const updateTimer = () => {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    timer.classList.toggle("ending", remaining <= 60);
  };

  const grade = (expired = false) => {
    if (submitted) return;
    submitted = true;
    window.clearInterval(interval);
    let score = 0;
    const errors = [];
    fieldsets.forEach(({ fieldset, feedback, question }, questionIndex) => {
      const selected = fieldset.querySelector("input:checked");
      const selectedIndex = selected ? Number(selected.value) : -1;
      if (selectedIndex === question.correct) score += 1;
      else errors.push({ questionIndex, selectedIndex, question });
      fieldset.querySelectorAll("input").forEach((radio) => { radio.disabled = true; });
      fieldset.querySelectorAll(".exam-options label").forEach((label, optionIndex) => {
        label.classList.toggle("correct", optionIndex === question.correct);
        label.classList.toggle("incorrect", optionIndex === selectedIndex && selectedIndex !== question.correct);
      });
      const status = document.createElement("strong");
      status.textContent = selectedIndex === question.correct ? "Correta" : "Incorreta";
      const explanation = document.createElement("p");
      setMathText(explanation, question.explanation || "Sem explicação adicional.");
      feedback.append(status, explanation);
      if (question.source) {
        const source = document.createElement("small");
        source.textContent = `Fonte indicada: ${question.source}`;
        feedback.append(source);
      }
      feedback.hidden = false;
    });
    const percent = Math.round((score / fieldsets.length) * 100);
    result.textContent = `${score}/${fieldsets.length} · ${percent}%`;
    submit.disabled = true;
    submit.textContent = expired ? "Tempo encerrado" : "Simulado entregue";
    timer.textContent = expired ? "Encerrado" : timer.textContent;
    progress.textContent = errors.length
      ? `${errors.length} questão(ões) para revisar`
      : "Parabéns: nenhuma questão errada";

    const report = document.createElement("section");
    report.className = "exam-report";
    const reportTitle = document.createElement("h4");
    reportTitle.textContent = "Relatório de erros";
    report.append(reportTitle);
    if (errors.length === 0) {
      const perfect = document.createElement("p");
      perfect.textContent = "Você acertou todas as questões.";
      report.append(perfect);
    } else {
      const list = document.createElement("ol");
      for (const error of errors) {
        const item = document.createElement("li");
        const correct = String.fromCharCode(65 + error.question.correct);
        const selected = error.selectedIndex >= 0 ? String.fromCharCode(65 + error.selectedIndex) : "não respondida";
        const summary = document.createElement("span");
        summary.textContent = `Questão ${error.questionIndex + 1}: marcou ${selected}; correta ${correct}. `;
        const explanation = document.createElement("span");
        setMathText(explanation, error.question.explanation);
        item.append(summary, explanation);
        list.append(item);
      }
      report.append(list);
    }
    panel.append(report);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    grade(false);
  });
  const interval = window.setInterval(() => {
    if (!panel.isConnected) {
      window.clearInterval(interval);
      return;
    }
    remaining -= 1;
    updateTimer();
    if (remaining <= 0) grade(true);
  }, 1_000);
  updateTimer();
  return true;
}

function renderExportControls(article, title, mode, material) {
  const printHeader = document.createElement("header");
  printHeader.className = "print-header";
  const brand = document.createElement("p");
  brand.textContent = "Biblioteca Matemática";
  const heading = document.createElement("h1");
  heading.textContent = title;
  const metadata = document.createElement("p");
  const date = new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
  metadata.textContent = `${t(MODE_LABELS[mode] || MODE_LABELS.ask)} · ${date}`;
  printHeader.append(brand, heading, metadata);
  article.prepend(printHeader);

  const controls = document.createElement("div");
  controls.className = "export-controls";
  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Salvar no caderno";
  save.addEventListener("click", () => saveMaterialToNotebook(material, save));
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Imprimir / Salvar PDF";
  button.addEventListener("click", () => {
    document.querySelectorAll(".print-target").forEach((target) => target.classList.remove("print-target"));
    article.classList.add("print-target");
    document.body.classList.add("printing");
    const previousTitle = document.title;
    document.title = `${t(MODE_LABELS[mode] || "Biblioteca")} - ${title}`.slice(0, 120);
    const cleanup = () => {
      article.classList.remove("print-target");
      document.body.classList.remove("printing");
      document.title = previousTitle;
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    window.addEventListener("focus", cleanup, { once: true });
    window.print();
  });
  controls.append(save, button);
  article.append(controls);
}

function setMode(mode) {
  if (!(mode in MODES) || state.busy) return;
  state.mode = mode;
  input.placeholder = t(MODES[mode].placeholder);
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
  input.focus();
}

function consumeSseBlock(block, target, sources) {
  if (!block.trim()) return false;
  const lines = block.split("\n");
  const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) return false;
  if (data === "[DONE]") return true;

  try {
    const payload = JSON.parse(data);
    if (event === "chunks" && Array.isArray(payload)) {
      sources.splice(0, sources.length, ...payload);
      return false;
    }
    const token = payload?.choices?.[0]?.delta?.content;
    if (typeof token === "string") {
      target.textContent += token;
    }
  } catch {
    // Ignore malformed or keepalive events; the next valid event can continue.
  }
  return false;
}

async function ask(question, displayQuestion = question, mode = "ask") {
  if (state.busy) return;
  state.busy = true;
  sendButton.disabled = true;

  createMessage("user", displayQuestion);
  state.messages.push({ role: "user", content: question });
  const assistant = createMessage("assistant");
  assistant.content.classList.add("typing");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: state.messages.slice(-12) }),
    });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => null);
      throw new Error(t(data?.error || "Não foi possível consultar a biblioteca."));
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const sources = [];
    let buffer = "";
    let done = false;

    while (!done) {
      const result = await reader.read();
      if (result.done) break;
      buffer += decoder.decode(result.value, { stream: true }).replace(/\r\n/g, "\n");
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";
      for (const block of blocks) {
        if (consumeSseBlock(block, assistant.content, sources)) {
          done = true;
          break;
        }
      }
    }

    if (buffer) consumeSseBlock(buffer, assistant.content, sources);
    const answer = assistant.content.textContent.trim();
    if (!answer) throw new Error(t("A biblioteca não retornou uma resposta."));
    const storyboard = mode === "podcast" ? parseVideoStoryboard(answer, displayQuestion) : null;
    const visibleAnswer = mode === "podcast" ? stripVideoStoryboard(answer) : answer;
    assistant.content.textContent = visibleAnswer;

    state.messages.push({ role: "assistant", content: answer });
    const examRendered = mode === "exam" && renderExam(
      assistant.article,
      assistant.content,
      answer,
      displayQuestion,
    );
    if (!examRendered) renderMathIn(assistant.content);
    if (mode === "podcast") renderAudioControls(assistant.article, visibleAnswer, displayQuestion, storyboard);
    if (mode === "mindmap") renderMindMap(assistant.article, answer, displayQuestion);
    renderSources(assistant.article, sources);
    renderExportControls(assistant.article, displayQuestion, mode, {
      title: displayQuestion,
      mode,
      answer,
      sources: collectSources(sources).map(({ name, page, score }) => ({ name, page, score })),
    });
  } catch (error) {
    assistant.article.classList.add("error");
    assistant.content.textContent = error instanceof Error ? t(error.message) : t("Ocorreu um erro inesperado.");
  } finally {
    assistant.content.classList.remove("typing");
    state.busy = false;
    sendButton.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const topic = input.value.trim();
  if (!topic) return;
  const question = MODES[state.mode].prompt(topic);
  input.value = "";
  resizeInput();
  void ask(question, topic, state.mode);
});

input.addEventListener("input", resizeInput);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

clearButton.addEventListener("click", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  state.messages.length = 0;
  window.location.reload();
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    const prompt = button.getAttribute("data-prompt");
    if (prompt) void ask(prompt);
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

catalogOpen.addEventListener("click", () => {
  catalogVisible = 36;
  catalogDialog.showModal();
  void loadCatalog();
  window.requestAnimationFrame(() => catalogQuery.focus());
});

catalogClose.addEventListener("click", () => catalogDialog.close());
catalogDialog.addEventListener("click", (event) => {
  if (event.target === catalogDialog) catalogDialog.close();
});
for (const control of [catalogQuery, catalogCategory, catalogIndexed]) {
  control.addEventListener("input", () => {
    catalogVisible = 36;
    renderCatalog();
  });
}
catalogMore.addEventListener("click", () => {
  catalogVisible += 36;
  renderCatalog();
});

queueToggle.addEventListener("click", () => {
  const willOpen = queueBody.hidden;
  queueBody.hidden = !willOpen;
  queueToggle.textContent = willOpen ? "Fechar fila" : "Abrir fila";
  queueToggle.setAttribute("aria-expanded", String(willOpen));
});

queueRemote.value = window.localStorage.getItem(REMOTE_STORAGE_KEY) || "";
queueRemote.addEventListener("input", () => {
  window.localStorage.setItem(REMOTE_STORAGE_KEY, queueRemote.value.trim());
  queueFeedback.textContent = "";
});

queueClear.addEventListener("click", () => {
  catalogQueue.clear();
  saveQueue();
  queueFeedback.textContent = "Fila limpa.";
  renderQueue();
  renderCatalog();
});

queueCopy.addEventListener("click", async () => {
  const remote = validatedRemote();
  if (!remote) {
    queueFeedback.textContent = "Informe o destino como remote:nome-do-bucket.";
    queueRemote.focus();
    return;
  }
  const filenames = catalogBooks
    ? catalogBooks.filter((book) => catalogQueue.has(book.filename) && !book.indexed).map((book) => book.filename)
    : [...catalogQueue];
  const commands = filenames.map((filename) => {
    const source = `${remote}/livros/${filename}`;
    const destination = `${remote}/rag-teste/${filename}`;
    return `rclone copyto ${shellQuote(source)} ${shellQuote(destination)} --progress`;
  });
  const copied = await copyPlainText(commands.join("\n"));
  queueFeedback.textContent = copied
    ? `${commands.length} comando(s) copiado(s). Execute no Termux e depois reindexe o AI Search.`
    : "Não foi possível copiar automaticamente. Tente novamente pelo navegador.";
});

notebookOpen.addEventListener("click", () => {
  renderNotebook();
  notebookDialog.showModal();
  window.requestAnimationFrame(() => notebookQuery.focus());
});
notebookClose.addEventListener("click", () => notebookDialog.close());
notebookDialog.addEventListener("click", (event) => {
  if (event.target === notebookDialog) notebookDialog.close();
});
for (const control of [notebookQuery, notebookMode, notebookStatus]) {
  control.addEventListener("input", renderNotebook);
}
notebookPrint.addEventListener("click", printNotebook);

planOpen.addEventListener("click", () => {
  document.querySelectorAll('input[name="study-day"]').forEach((input) => {
    input.checked = studyPlan.settings.days.includes(Number(input.value));
  });
  planDefaultMinutes.value = String(studyPlan.settings.minutes);
  planTaskMinutes.value = String(studyPlan.settings.minutes);
  if (!planTaskDate.value) planTaskDate.value = planDateKey();
  renderStudyPlan();
  planDialog.showModal();
  window.requestAnimationFrame(() => planTaskTitle.focus());
});
planClose.addEventListener("click", () => planDialog.close());
planDialog.addEventListener("click", (event) => {
  if (event.target === planDialog) planDialog.close();
});
planGenerate.addEventListener("click", generateStudyWeek);
planAddForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = planTaskTitle.value.trim();
  const date = planTaskDate.value;
  const minutes = Math.max(5, Math.min(Number(planTaskMinutes.value) || 45, 240));
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  studyPlan.tasks.push({
    id: newNotebookId(),
    title,
    date,
    minutes,
    done: false,
    generated: false,
  });
  studyPlan.tasks = studyPlan.tasks.slice(-500);
  persistStudyPlan();
  planTaskTitle.value = "";
  planTaskMinutes.value = String(studyPlan.settings.minutes);
  renderStudyPlan();
  planTaskTitle.focus();
});
studyTimerToggle.addEventListener("click", toggleStudyTimer);
studyTimerFinish.addEventListener("click", () => finishStudyTimer(false));
planPrevWeek.addEventListener("click", () => {
  planWeekOffset -= 1;
  renderStudyPlan();
});
planNextWeek.addEventListener("click", () => {
  planWeekOffset += 1;
  renderStudyPlan();
});
planCurrentWeek.addEventListener("click", () => {
  planWeekOffset = 0;
  renderStudyPlan();
});

onLanguageChange(() => {
  input.placeholder = t(MODES[state.mode].placeholder);
  renderQueue();
  renderNotebook();
  renderStudyPlan();
  if (catalogBooks) renderCatalog();
  applyTranslations();
});

renderQueue();
renderNotebook();
document.querySelectorAll('input[name="study-day"]').forEach((input) => {
  input.checked = studyPlan.settings.days.includes(Number(input.value));
});
planDefaultMinutes.value = String(studyPlan.settings.minutes);
planTaskMinutes.value = String(studyPlan.settings.minutes);
planTaskDate.value = planDateKey();
ensureStudyTimerInterval();
renderStudyPlan();
resizeInput();
