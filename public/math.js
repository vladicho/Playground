const MATH_NS = "http://www.w3.org/1998/Math/MathML";

const SYMBOLS = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", theta: "θ",
  lambda: "λ", mu: "μ", pi: "π", rho: "ρ", sigma: "σ", phi: "φ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Pi: "Π", Sigma: "Σ", Phi: "Φ", Omega: "Ω",
  times: "×", cdot: "·", div: "÷", pm: "±", mp: "∓", le: "≤", leq: "≤", ge: "≥", geq: "≥",
  neq: "≠", approx: "≈", equiv: "≡", infty: "∞", sum: "∑", prod: "∏", int: "∫", partial: "∂",
  nabla: "∇", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", cup: "∪", cap: "∩",
  to: "→", rightarrow: "→", leftarrow: "←", Rightarrow: "⇒", Leftrightarrow: "⇔",
  ldots: "…", cdots: "⋯", angle: "∠", degree: "°", perp: "⊥",
};

const FUNCTIONS = new Set(["sin", "cos", "tan", "log", "ln", "lim", "max", "min", "det"]);
const OPERATORS = new Set(["+", "-", "=", "<", ">", "(", ")", "[", "]", "|", ",", ";", ":", "!"]);

function element(name, text) {
  const node = document.createElementNS(MATH_NS, name);
  if (text !== undefined) node.textContent = text;
  return node;
}

function appendChildren(target, source) {
  while (source.firstChild) target.append(source.firstChild);
  return target;
}

function matrixFromLatex(latex) {
  const match = latex.trim().match(/^\\begin\{(p|b|v|V)?matrix\}([\s\S]*?)\\end\{\1?matrix\}$/);
  if (!match) return null;
  const type = match[1] || "";
  const table = element("mtable");
  for (const rowSource of match[2].split(/\\\\/)) {
    const row = element("mtr");
    for (const cellSource of rowSource.split("&")) {
      const cell = element("mtd");
      cell.append(new LatexParser(cellSource.trim()).parse());
      row.append(cell);
    }
    table.append(row);
  }
  if (!type) return table;
  const fences = { p: ["(", ")"], b: ["[", "]"], v: ["|", "|"], V: ["‖", "‖"] }[type];
  const row = element("mrow");
  row.append(element("mo", fences[0]), table, element("mo", fences[1]));
  return row;
}

class LatexParser {
  constructor(source) {
    this.source = source;
    this.index = 0;
  }

  parse(stop = "") {
    const row = element("mrow");
    while (this.index < this.source.length && this.source[this.index] !== stop) {
      const atom = this.parseAtom();
      if (atom) row.append(atom);
    }
    if (stop && this.source[this.index] === stop) this.index += 1;
    return row;
  }

  parseRequiredGroup() {
    this.skipSpaces();
    if (this.source[this.index] === "{") {
      this.index += 1;
      return this.parse("}");
    }
    return this.parseAtom(false) || element("mrow");
  }

  parseRawGroup() {
    this.skipSpaces();
    if (this.source[this.index] !== "{") return "";
    this.index += 1;
    let depth = 1;
    let value = "";
    while (this.index < this.source.length && depth > 0) {
      const char = this.source[this.index++];
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (depth > 0) value += char;
    }
    return value;
  }

  skipSpaces() {
    while (/\s/.test(this.source[this.index] || "")) this.index += 1;
  }

  parseCommand() {
    this.index += 1;
    const start = this.index;
    while (/[A-Za-z]/.test(this.source[this.index] || "")) this.index += 1;
    const command = this.source.slice(start, this.index) || this.source[this.index++];

    if (command === "frac" || command === "dfrac" || command === "tfrac") {
      const fraction = element("mfrac");
      fraction.append(this.parseRequiredGroup(), this.parseRequiredGroup());
      return fraction;
    }
    if (command === "sqrt") {
      this.skipSpaces();
      if (this.source[this.index] === "[") {
        this.index += 1;
        const degreeStart = this.index;
        while (this.index < this.source.length && this.source[this.index] !== "]") this.index += 1;
        const degree = new LatexParser(this.source.slice(degreeStart, this.index)).parse();
        if (this.source[this.index] === "]") this.index += 1;
        const root = element("mroot");
        root.append(this.parseRequiredGroup(), degree);
        return root;
      }
      const root = element("msqrt");
      root.append(this.parseRequiredGroup());
      return root;
    }
    if (command === "text" || command === "mathrm" || command === "operatorname") {
      const value = this.parseRawGroup();
      return element(command === "text" ? "mtext" : "mi", value);
    }
    if (command === "left" || command === "right") {
      this.skipSpaces();
      const fence = this.source[this.index] === "\\" ? this.parseCommand().textContent : this.source[this.index++];
      return element("mo", fence || "");
    }
    if ([",", ";", ":", "!", "quad", "qquad"].includes(command)) {
      const space = element("mspace");
      space.setAttribute("width", command === "qquad" ? "2em" : command === "quad" ? "1em" : ".25em");
      return space;
    }
    if (["displaystyle", "textstyle", "limits", "nolimits"].includes(command)) return null;
    if (FUNCTIONS.has(command)) return element("mi", command);
    if (SYMBOLS[command]) return element("mo", SYMBOLS[command]);
    return element("mi", command);
  }

  parseAtom(withScripts = true) {
    this.skipSpaces();
    if (this.index >= this.source.length) return null;
    const char = this.source[this.index];
    let base;

    if (char === "{") {
      this.index += 1;
      base = this.parse("}");
    } else if (char === "\\") {
      base = this.parseCommand();
      if (!base) return this.parseAtom(withScripts);
    } else if (/\d/.test(char)) {
      const start = this.index;
      while (/[\d.,]/.test(this.source[this.index] || "")) this.index += 1;
      base = element("mn", this.source.slice(start, this.index));
    } else if (/[A-Za-z]/.test(char)) {
      this.index += 1;
      base = element("mi", char);
    } else {
      this.index += 1;
      base = element(OPERATORS.has(char) ? "mo" : "mi", char);
    }

    if (!withScripts) return base;
    this.skipSpaces();
    let sub = null;
    let sup = null;
    while (this.source[this.index] === "_" || this.source[this.index] === "^") {
      const marker = this.source[this.index++];
      const value = this.parseRequiredGroup();
      if (marker === "_") sub = value;
      if (marker === "^") sup = value;
      this.skipSpaces();
    }
    if (sub && sup) {
      const scripted = element("msubsup");
      scripted.append(base, sub, sup);
      return scripted;
    }
    if (sub) {
      const scripted = element("msub");
      scripted.append(base, sub);
      return scripted;
    }
    if (sup) {
      const scripted = element("msup");
      scripted.append(base, sup);
      return scripted;
    }
    return base;
  }
}

function createMath(latex, display) {
  const math = element("math");
  math.setAttribute("display", display ? "block" : "inline");
  math.setAttribute("aria-label", latex);
  const matrix = matrixFromLatex(latex);
  math.append(matrix || new LatexParser(latex).parse());
  return math;
}

function findMathSegments(text) {
  const patterns = [
    { open: "$$", close: "$$", display: true },
    { open: "\\[", close: "\\]", display: true },
    { open: "\\(", close: "\\)", display: false },
    { open: "$", close: "$", display: false },
  ];
  const segments = [];
  let cursor = 0;
  let plainStart = 0;

  while (cursor < text.length) {
    const pattern = patterns.find(({ open }) => text.startsWith(open, cursor));
    if (!pattern || (cursor > 0 && text[cursor - 1] === "\\" && pattern.open === "$")) {
      cursor += 1;
      continue;
    }
    const contentStart = cursor + pattern.open.length;
    const closeAt = text.indexOf(pattern.close, contentStart);
    if (closeAt < 0) {
      cursor += pattern.open.length;
      continue;
    }
    if (cursor > plainStart) segments.push({ type: "text", value: text.slice(plainStart, cursor) });
    segments.push({ type: "math", value: text.slice(contentStart, closeAt).trim(), display: pattern.display });
    cursor = closeAt + pattern.close.length;
    plainStart = cursor;
  }
  if (plainStart < text.length) segments.push({ type: "text", value: text.slice(plainStart) });
  return segments;
}

async function copyLatex(latex, button) {
  const previous = button.textContent;
  try {
    await navigator.clipboard.writeText(latex);
    button.textContent = "Copiado";
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = latex;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.append(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    button.textContent = copied ? "Copiado" : "Não copiou";
  }
  window.setTimeout(() => { button.textContent = previous; }, 1_200);
}

export function renderMathIn(container) {
  const text = container.textContent;
  const segments = findMathSegments(text);
  if (!segments.some((segment) => segment.type === "math")) return;
  const fragment = document.createDocumentFragment();

  for (const segment of segments) {
    if (segment.type === "text") {
      fragment.append(document.createTextNode(segment.value));
      continue;
    }
    const wrapper = document.createElement(segment.display ? "div" : "span");
    wrapper.className = segment.display ? "math-expression math-display" : "math-expression math-inline";
    wrapper.append(createMath(segment.value, segment.display));
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "math-copy";
    copy.textContent = segment.display ? "Copiar LaTeX" : "⧉";
    copy.title = "Copiar LaTeX";
    copy.setAttribute("aria-label", "Copiar fórmula em LaTeX");
    copy.addEventListener("click", () => void copyLatex(segment.value, copy));
    wrapper.append(copy);
    fragment.append(wrapper);
  }
  container.replaceChildren(fragment);
}
