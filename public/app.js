const conversation = document.querySelector("#conversation");
const form = document.querySelector("#chat-form");
const input = document.querySelector("#question");
const sendButton = document.querySelector("#send-button");
const clearButton = document.querySelector("#clear-chat");
const modeButtons = document.querySelectorAll("[data-mode]");

const MODES = {
  ask: {
    placeholder: "Pergunte sobre os documentos…",
    prompt: (topic) => topic,
  },
  summary: {
    placeholder: "Assunto ou nome do documento para resumir…",
    prompt: (topic) =>
      `Crie um resumo didático sobre "${topic}" usando somente informações sustentadas pelos documentos recuperados. Organize em: visão geral, conceitos principais, fórmulas ou definições importantes e pontos para revisar. Diferencie claramente o conteúdo das fontes de qualquer explicação sua.`,
  },
  quiz: {
    placeholder: "Assunto do quiz…",
    prompt: (topic) =>
      `Crie um quiz de estudo sobre "${topic}" com 5 questões objetivas baseadas nos documentos recuperados. Dê quatro alternativas por questão. Coloque o gabarito comentado somente depois de todas as perguntas e explique qual informação da fonte sustenta cada resposta.`,
  },
  flashcards: {
    placeholder: "Assunto dos flashcards…",
    prompt: (topic) =>
      `Crie 10 flashcards sobre "${topic}" com base nos documentos recuperados. Use o formato numerado "Frente:" e "Verso:". Faça cartões curtos, sem repetir ideias, e não invente informações ausentes nas fontes.`,
  },
  mindmap: {
    placeholder: "Assunto do mapa mental…",
    prompt: (topic) =>
      `Crie um mapa mental textual sobre "${topic}" usando os documentos recuperados. Comece pelo tema central e organize ramos e sub-ramos com indentação e conectores. Inclua conceitos, relações, fórmulas e exemplos somente quando sustentados pelas fontes.`,
  },
  podcast: {
    placeholder: "Assunto do roteiro de podcast…",
    prompt: (topic) =>
      `Crie um roteiro curto de podcast educativo, de aproximadamente 3 minutos, sobre "${topic}". Use duas vozes chamadas Apresentador e Especialista, linguagem natural e explicações baseadas nos documentos recuperados. Termine com três pontos de revisão. Não invente fatos ausentes nas fontes.`,
  },
};

const state = {
  messages: [],
  busy: false,
  mode: "ask",
};

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

function renderSources(article, chunks) {
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
  if (unique.size === 0) return;

  const sources = document.createElement("section");
  sources.className = "sources";
  sources.setAttribute("aria-label", "Fontes recuperadas");

  const heading = document.createElement("div");
  heading.className = "sources-heading";
  const title = document.createElement("strong");
  title.textContent = `Fontes recuperadas (${unique.size})`;
  const note = document.createElement("small");
  note.textContent = "Similaridade indica recuperação, não garante que toda a resposta esteja na fonte.";
  heading.append(title, note);
  sources.append(heading);

  for (const [key, details] of unique) {
    const source = document.createElement("details");
    source.className = "source-card";
    const summary = document.createElement("summary");
    const name = document.createElement("b");
    name.textContent = cleanSourceName(key);
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

function setMode(mode) {
  if (!(mode in MODES) || state.busy) return;
  state.mode = mode;
  input.placeholder = MODES[mode].placeholder;
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

async function ask(question, displayQuestion = question) {
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
      throw new Error(data?.error || "Não foi possível consultar a biblioteca.");
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
    if (!answer) throw new Error("A biblioteca não retornou uma resposta.");

    state.messages.push({ role: "assistant", content: answer });
    renderSources(assistant.article, sources);
  } catch (error) {
    assistant.article.classList.add("error");
    assistant.content.textContent = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
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
  void ask(question, topic);
});

input.addEventListener("input", resizeInput);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

clearButton.addEventListener("click", () => {
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

resizeInput();
