import { renderMathIn } from "./math.js";

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
      `Crie um mapa mental sobre "${topic}" usando os documentos recuperados. Dê uma introdução curta e depois inclua obrigatoriamente um bloco entre as linhas "MAPA MENTAL" e "FIM DO MAPA". Dentro dele, use apenas marcadores com hífen: a primeira linha sem recuo é o tema central; ramos usam dois espaços de recuo; sub-ramos usam quatro espaços. Limite a 24 nós com textos curtos. Inclua conceitos, relações, fórmulas e exemplos somente quando sustentados pelas fontes.`,
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

let activeSpeech = null;

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

function renderAudioControls(article, text) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

  const controls = document.createElement("div");
  controls.className = "audio-controls";
  const play = document.createElement("button");
  play.type = "button";
  play.textContent = "▶ Ouvir roteiro";
  const stop = document.createElement("button");
  stop.type = "button";
  stop.textContent = "■ Parar";
  stop.disabled = true;

  const reset = () => {
    play.disabled = false;
    stop.disabled = true;
    if (activeSpeech?.controls === controls) activeSpeech = null;
  };

  play.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    const spokenText = text
      .replace(/[*_#`]/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "pt-BR";
    utterance.rate = 1;
    const voice = window.speechSynthesis
      .getVoices()
      .find((candidate) => candidate.lang.toLowerCase().startsWith("pt-br"));
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

  controls.append(play, stop);
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
    renderMathIn(assistant.content);
    if (mode === "podcast") renderAudioControls(assistant.article, answer);
    if (mode === "mindmap") renderMindMap(assistant.article, answer, displayQuestion);
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

resizeInput();
