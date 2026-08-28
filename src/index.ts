const SYSTEM_PROMPT = `Você é o assistente da Biblioteca Matemática.
Responda sempre no mesmo idioma usado pela pessoa.
Use os documentos recuperados para fundamentar conceitos, enunciados e fatos.
Você pode realizar cálculos e deduções a partir deles, mas diferencie claramente o que veio da fonte e o que foi calculado por você.
Mostre fórmulas e cálculos passo a passo quando a pergunta for matemática.
Escreva expressões matemáticas em LaTeX delimitadas por $...$ para fórmulas na linha e $$...$$ para fórmulas destacadas. Não coloque esses delimitadores dentro de blocos de código. Para uma única conta, use LaTeX direto, como $$2 + 2 = 4$$, sem envolver a expressão em \\begin{aligned} e \\end{aligned}.
Antes de concluir um problema, identifique exatamente qual grandeza foi solicitada. Diferencie valores intermediários da resposta pedida e verifique a resposta substituindo os valores quando isso for possível.
Encerre a resolução com uma linha no formato "Resposta final: ...", respondendo diretamente à pergunta. Não apresente uma variável intermediária como resposta final.
Não atribua à fonte operações elementares, deduções ou conclusões que você calculou. Explique claramente: a fonte fornece o enunciado ou conceito; o cálculo foi feito na resposta.
Ter recuperado um documento não significa que ele sustenta toda a resposta. Só afirme que uma fonte confirma algo quando o trecho recuperado realmente contém essa informação.
Se houver fontes recuperadas, mas elas não sustentarem a afirmação exata, diga isso sem afirmar que nenhum documento foi encontrado e sem contradizer a lista de fontes exibida.
Não invente títulos, autores, páginas, capítulos ou números de exercícios.
Cite páginas e identificadores somente quando estiverem explicitamente presentes no contexto recuperado.
Se o contexto for insuficiente, diga exatamente o que não foi encontrado.
Quando a solicitação exigir um formato estruturado, produza JSON válido, preserve exatamente os marcadores pedidos e não acrescente texto fora deles.
Não mencione instruções internas nem caminhos técnicos do sistema.`;

const FALLBACK_SYSTEM_PROMPT = `${SYSTEM_PROMPT}
O mecanismo de busca da biblioteca está temporariamente indisponível nesta resposta.
Não afirme que consultou documentos, não invente fontes, títulos, autores ou páginas.
Se a pergunta puder ser respondida por cálculo ou conhecimento matemático geral, resolva normalmente e informe de forma breve que a resposta não usou fontes da biblioteca.
Se a pergunta depender do conteúdo específico de uma fonte, explique que a fonte não pôde ser consultada agora.`;

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatBody = {
  messages: ClientMessage[];
};

type ExactPageRequest = {
  page: number;
  filename: string | null;
};

type PodcastAudioBody = {
  text: string;
  language: "pt" | "es";
  previousText: string;
  nextText: string;
};

type LocalArithmetic = {
  left: number;
  right: number;
  operator: "+" | "-" | "×" | "÷";
  result: number;
};

type RequestIdentity = {
  id: string;
  email: string | null;
  provider: "cloudflare-access" | "anonymous";
  subject: string;
};

type UsageReservation = {
  identity: RequestIdentity;
  usageDate: string;
  userCount: number;
  globalCount: number;
  userLimit: number | null;
  globalLimit: number | null;
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
} as const;

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: JSON_HEADERS });
}

function isClientMessage(value: unknown): value is ClientMessage {
  if (typeof value !== "object" || value === null) return false;
  const record = value as { role?: unknown; content?: unknown };
  return (
    (record.role === "user" || record.role === "assistant") &&
    typeof record.content === "string" &&
    record.content.trim().length > 0 &&
    record.content.length <= 12_000
  );
}

function parseChatBody(value: unknown): ChatBody | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as { messages?: unknown };
  if (!Array.isArray(record.messages)) return null;

  const messages = record.messages.slice(-12);
  if (messages.length === 0 || !messages.every(isClientMessage)) return null;
  if (messages.at(-1)?.role !== "user") return null;

  return { messages };
}

function parseLocalArithmetic(messages: ClientMessage[]): LocalArithmetic | null {
  const latest = messages.at(-1)?.content ?? "";
  const directQuestion = latest.trim().replace(/[?¿]\s*$/u, "");
  const isPodcast = /VIDEOAULA_JSON/iu.test(latest);
  const candidates = isPodcast
    ? [...latest.matchAll(/["“]([^"“”\n]{1,120})["”]/gu)]
        .flatMap((match) => match[1] ? [match[1]] : [])
    : [directQuestion];

  for (const candidate of candidates) {
    const match = candidate.trim().match(
      /^(-?\d+(?:[.,]\d+)?)\s*([+\-−*×xX/÷])\s*(-?\d+(?:[.,]\d+)?)$/u,
    );
    if (!match) continue;

    const leftValue = match[1];
    const rawOperator = match[2];
    const rightValue = match[3];
    if (!leftValue || !rawOperator || !rightValue) continue;

    const left = Number(leftValue.replace(",", "."));
    const right = Number(rightValue.replace(",", "."));
    if (!Number.isFinite(left) || !Number.isFinite(right)) continue;

    const operator = rawOperator === "+"
      ? "+"
      : rawOperator === "-" || rawOperator === "−"
        ? "-"
        : rawOperator === "/" || rawOperator === "÷"
          ? "÷"
          : "×";
    if (operator === "÷" && right === 0) continue;

    const rawResult = operator === "+"
      ? left + right
      : operator === "-"
        ? left - right
        : operator === "×"
          ? left * right
          : left / right;
    const result = Number(rawResult.toPrecision(12));
    if (Number.isFinite(result)) return { left, right, operator, result };
  }

  return null;
}

function localNumber(value: number): string {
  return String(value).replace(".", ",");
}

function localArithmeticAnswer(
  arithmetic: LocalArithmetic,
  messages: ClientMessage[],
): string {
  const latest = messages.at(-1)?.content ?? "";
  const isPodcast = /VIDEOAULA_JSON/iu.test(latest);
  const isSpanish = /\b(?:Crea|guion|documentos recuperados|tres puntos)\b/iu.test(latest);
  const left = localNumber(arithmetic.left);
  const right = localNumber(arithmetic.right);
  const result = localNumber(arithmetic.result);
  const equation = `${left} ${arithmetic.operator} ${right} = ${result}`;

  if (!isPodcast) {
    return isSpanish
      ? `Este cálculo se realizó directamente, sin usar fuentes de la biblioteca.\n\n$$${equation}$$\n\nRespuesta final: ${result}.`
      : `Este cálculo foi realizado diretamente, sem usar fontes da biblioteca.\n\n$$${equation}$$\n\nResposta final: ${result}.`;
  }

  const operation = arithmetic.operator === "+"
    ? (isSpanish ? "sumar" : "somar")
    : arithmetic.operator === "-"
      ? (isSpanish ? "restar" : "subtrair")
      : arithmetic.operator === "×"
        ? (isSpanish ? "multiplicar" : "multiplicar")
        : (isSpanish ? "dividir" : "dividir");
  const groups = arithmetic.operator === "+"
    && Number.isInteger(arithmetic.left)
    && Number.isInteger(arithmetic.right)
    && arithmetic.left >= 0
    && arithmetic.right >= 0
    && arithmetic.left <= 20
    && arithmetic.right <= 20
      ? [
          { label: isSpanish ? "Primer grupo" : "Primeiro grupo", count: arithmetic.left },
          { label: isSpanish ? "Segundo grupo" : "Segundo grupo", count: arithmetic.right },
        ]
      : null;
  const storyboard = {
    title: equation,
    scenes: [
      {
        type: "title",
        heading: isSpanish ? `¿Cuánto es ${left} ${arithmetic.operator} ${right}?` : `Quanto é ${left} ${arithmetic.operator} ${right}?`,
        caption: isSpanish ? "Vamos a representar la operación." : "Vamos representar a operação.",
        duration: 4,
      },
      groups
        ? {
            type: "groups",
            heading: isSpanish ? "Juntando los grupos" : "Juntando os grupos",
            groups,
            caption: isSpanish ? "Los dos grupos forman una sola cantidad." : "Os dois grupos formam uma única quantidade.",
            duration: 6,
          }
        : {
            type: "equation",
            heading: isSpanish ? "Representando la operación" : "Representando a operação",
            steps: [`${left} ${arithmetic.operator} ${right}`, equation],
            duration: 6,
          },
      {
        type: "equation",
        heading: isSpanish ? "Cálculo" : "Cálculo",
        steps: [`${left} ${arithmetic.operator} ${right}`, equation],
        caption: `${operation}: ${equation}`,
        duration: 6,
      },
      {
        type: "final",
        heading: isSpanish ? "Resultado verificado" : "Resultado verificado",
        result,
        verification: equation,
        duration: 5,
      },
    ],
  };

  const script = isSpanish
    ? `Este episodio fue calculado directamente y no utilizó fuentes de la biblioteca.\n\nPresentador: Hoy vamos a entender cuánto es ${left} ${arithmetic.operator} ${right}.\n\nEspecialista: La operación pide ${operation} ${left} y ${right}. Al representar las cantidades y efectuar el cálculo, obtenemos ${result}.\n\nPresentador: Entonces ${equation}.\n\nTres puntos para revisar:\n1. Identifica la operación.\n2. Representa las cantidades.\n3. Comprueba el resultado.\n\nRespuesta final: ${result}.`
    : `Este episódio foi calculado diretamente e não utilizou fontes da biblioteca.\n\nApresentador: Hoje vamos entender quanto é ${left} ${arithmetic.operator} ${right}.\n\nEspecialista: A operação pede para ${operation} ${left} e ${right}. Ao representar as quantidades e efetuar o cálculo, obtemos ${result}.\n\nApresentador: Portanto, ${equation}.\n\nTrês pontos para revisar:\n1. Identifique a operação.\n2. Represente as quantidades.\n3. Verifique o resultado.\n\nResposta final: ${result}.`;
  return `${script}\n\nVIDEOAULA_JSON\n${JSON.stringify(storyboard)}\nFIM_VIDEOAULA_JSON`;
}

function parseExactPageRequest(messages: ClientMessage[]): ExactPageRequest | null {
  const latest = messages.at(-1)?.content ?? "";
  const pageMatch = latest.match(/\b(?:página|pagina|página\s+n[.º°]?|pagina\s+n[.º°]?|p[.]?)\s*(\d{1,5})\b/iu);
  if (!pageMatch) return null;

  const page = Number(pageMatch[1]);
  if (!Number.isSafeInteger(page) || page < 1) return null;

  let filename: string | null = null;
  for (const message of [...messages].reverse()) {
    if (message.role !== "user") continue;
    const quoted = [...message.content.matchAll(/["“']([^"“”'\n]{1,240}[.]pdf)["”']?/giu)]
      .flatMap((match) => match[1] ? [match[1].trim()] : []);
    const compact = message.content.match(/\b[\p{L}\p{N}_.()\-]+[.]pdf\b/giu) ?? [];
    const candidates = [...new Set(quoted.length ? quoted : compact)];
    if (candidates.length > 1) return { page, filename: null };
    const candidate = candidates[0];
    if (candidate) {
      filename = candidate;
      break;
    }
  }

  return { page, filename };
}

function basename(value: string): string {
  return value.split("/").at(-1) || value;
}

function normalizedFilename(value: string): string {
  return basename(value).normalize("NFKC").trim().toLocaleLowerCase("pt-BR");
}

function chunkPage(metadata: Record<string, unknown> | undefined): number | null {
  if (!metadata) return null;
  for (const key of ["page", "page_number", "pageNumber"]) {
    const value = metadata[key];
    const page = typeof value === "number" ? value : Number(value);
    if (Number.isSafeInteger(page) && page > 0) return page;
  }
  return null;
}

function sseTextResponse(
  answer: string,
  chunks: Array<{ id: string; text: string; item: { key: string; metadata?: Record<string, unknown> } }> = [],
  headers: HeadersInit = {},
): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      if (chunks.length) {
        const publicChunks = chunks.map((chunk) => ({ ...chunk, type: "text", score: 1 }));
        controller.enqueue(encoder.encode(`event: chunks\ndata: ${JSON.stringify(publicChunks)}\n\n`));
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: answer } }] })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

async function exactPageResponse(
  request: ExactPageRequest,
  env: Env,
  headers: HeadersInit,
): Promise<Response> {
  if (!request.filename) {
    return sseTextResponse(
      `De qual documento você quer a página ${request.page}? Informe o nome do PDF para eu consultar a página exata.`,
      [],
      headers,
    );
  }

  const listed = await env.AI_SEARCH.items.list({ search: request.filename, per_page: 50 });
  const wanted = normalizedFilename(request.filename);
  const item = listed.result.find((candidate) => normalizedFilename(candidate.key) === wanted);
  if (!item) {
    return sseTextResponse(
      `Não encontrei o documento “${basename(request.filename)}” no índice. Confira o nome do PDF e tente novamente.`,
      [],
      headers,
    );
  }

  const matchingChunks: AiSearchItemChunk[] = [];
  let offset = 0;
  let total = 1;
  while (offset < total && offset < 2_000) {
    const page = await env.AI_SEARCH.items.get(item.id).chunks({ limit: 100, offset });
    total = page.result_info.total;
    matchingChunks.push(...page.result.filter((chunk) => chunkPage(chunk.item?.metadata) === request.page));
    offset += page.result_info.count;
    if (page.result_info.count === 0) break;
  }

  if (!matchingChunks.length) {
    return sseTextResponse(
      `O documento “${basename(item.key)}” está indexado, mas a página ${request.page} não possui texto identificável por página no índice atual. Será necessário reindexar esse PDF com separação por páginas.`,
      [],
      headers,
    );
  }

  const text = matchingChunks.map((chunk) => chunk.text.trim()).filter(Boolean).join("\n\n");
  const answer = `Conteúdo recuperado da página ${request.page} de “${basename(item.key)}”:\n\n${text}`;
  return sseTextResponse(answer, matchingChunks.map((chunk) => ({
    id: chunk.id,
    text: chunk.text,
    item: {
      key: chunk.item?.key || item.key,
      metadata: { ...(chunk.item?.metadata ?? {}), page: request.page },
    },
  })), headers);
}

function parsePodcastAudioBody(value: unknown): PodcastAudioBody | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as {
    text?: unknown;
    language?: unknown;
    previousText?: unknown;
    nextText?: unknown;
  };
  if (typeof record.text !== "string") return null;
  if (record.language !== "pt" && record.language !== "es") return null;

  const cleanText = (text: string) => text
    .replace(/[*_#`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const text = cleanText(record.text);
  if (text.length < 1 || text.length > 6_000) return null;

  const previousText = typeof record.previousText === "string"
    ? cleanText(record.previousText)
    : "";
  const nextText = typeof record.nextText === "string"
    ? cleanText(record.nextText)
    : "";
  if (previousText.length > 2_000 || nextText.length > 2_000) return null;

  return { text, language: record.language, previousText, nextText };
}

function generatedAudioUrl(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.audio === "string" && record.audio.startsWith("https://")) {
    return record.audio;
  }
  if (typeof record.result === "object" && record.result !== null) {
    const nested = (record.result as Record<string, unknown>).audio;
    if (typeof nested === "string" && nested.startsWith("https://")) return nested;
  }
  return null;
}

function audioHeaders(engine: "elevenlabs" | "grok" | "aura" | "melotts"): HeadersInit {
  return {
    "content-type": "audio/mpeg",
    "cache-control": "private, no-store",
    "content-disposition": 'inline; filename="podcast-playground.mp3"',
    "x-content-type-options": "nosniff",
    "x-playground-tts": engine,
  };
}

async function elevenLabsAudio(body: PodcastAudioBody, env: Env): Promise<Response> {
  const apiKey = env.ELEVENLABS_API_KEY?.trim();
  const voiceId = env.ELEVENLABS_VOICE_ID?.trim() || "fhtZMBwha5du5OxuvexO";
  const modelId = env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";
  if (!apiKey) throw new Error("ElevenLabs não configurada.");
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(voiceId)) {
    throw new Error("O identificador da voz da ElevenLabs é inválido.");
  }

  const requestBody: Record<string, unknown> = {
    text: body.text,
    model_id: modelId,
  };
  if (body.previousText) requestBody.previous_text = body.previousText;
  if (body.nextText) requestBody.next_text = body.nextText;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        accept: "audio/mpeg",
        "content-type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60_000),
    },
  );

  if (!response.ok || !response.body) {
    throw new Error(`ElevenLabs TTS falhou (${response.status}).`);
  }

  return new Response(response.body, {
    headers: {
      ...audioHeaders("elevenlabs"),
      "content-type": response.headers.get("content-type") || "audio/mpeg",
    },
  });
}

async function auraAudio(body: PodcastAudioBody, env: Env): Promise<Response> {
  const response = await env.AI.run("@cf/deepgram/aura-2-es", {
    text: body.text,
    speaker: body.language === "es" ? "aquila" : "celeste",
    encoding: "mp3",
  }, { returnRawResponse: true });

  if (!response.ok || !response.body) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Aura TTS falhou (${response.status}): ${detail || "resposta vazia"}`);
  }

  return new Response(response.body, {
    headers: {
      ...audioHeaders("aura"),
      "content-type": response.headers.get("content-type") || "audio/mpeg",
    },
  });
}

async function melottsAudio(body: PodcastAudioBody, env: Env): Promise<Response> {
  const result = await env.AI.run("@cf/myshell-ai/melotts", {
    prompt: body.text,
    // MeloTTS não oferece português; espanhol é o fallback fonético mais próximo.
    lang: "ES",
  });

  if (result instanceof Uint8Array) {
    return new Response(result, { headers: audioHeaders("melotts") });
  }
  if (typeof result === "object" && result !== null && "audio" in result) {
    const audio = (result as { audio: unknown }).audio;
    if (typeof audio === "string" && audio.length > 0) {
      // Repassar o Base64 evita decodificar milhões de bytes em JavaScript no
      // Worker, operação que pode exceder o limite de CPU. O navegador faz a
      // conversão uma única vez antes de tocar ou montar o vídeo.
      return new Response(audio, {
        headers: {
          "content-type": "text/plain; charset=us-ascii",
          "cache-control": "private, no-store",
          "content-disposition": 'inline; filename="podcast-playground.mp3.base64"',
          "x-content-type-options": "nosniff",
          "x-playground-tts": "melotts",
          "x-playground-audio-encoding": "base64",
          "x-playground-audio-type": "audio/mpeg",
        },
      });
    }
  }
  throw new Error("MeloTTS não retornou áudio.");
}

async function podcastAudio(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, {
      status: 405,
      headers: { allow: "POST", "cache-control": "no-store" },
    });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 16_000) {
    return jsonError("O roteiro excedeu o limite permitido.", 413);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("JSON inválido.", 400);
  }
  if (JSON.stringify(rawBody).length > 16_000) {
    return jsonError("O roteiro excedeu o limite permitido.", 413);
  }

  const body = parsePodcastAudioBody(rawBody);
  if (!body) {
    return jsonError("Envie um roteiro válido em português ou espanhol.", 400);
  }

  let elevenLabsError: unknown = null;
  try {
    return await elevenLabsAudio(body, env);
  } catch (error) {
    elevenLabsError = error;
  }

  if (body.language === "pt") {
    const providerError = elevenLabsError instanceof Error
      ? elevenLabsError.message
      : String(elevenLabsError);
    console.error(JSON.stringify({
      message: "ElevenLabs podcast generation failed",
      error: providerError,
    }));
    const status = providerError.match(/\((\d{3})\)/u)?.[1];
    return jsonError(
      `A ElevenLabs não gerou o áudio${status ? ` (erro ${status})` : ""}. Verifique a chave, a permissão Text to Speech, a voz selecionada e a cota da conta.`,
      502,
    );
  }

  let grokError: unknown = new Error("Grok TTS desativado; usando MeloTTS.");
  if (env.GROK_TTS_ENABLED === "true") {
    try {
      const result = await env.AI.run("xai/grok-tts", {
        text: body.text,
        language: body.language === "es" ? "es-ES" : "pt-BR",
        voice_id: body.language === "es" ? "ara" : "sal",
        text_normalization: true,
      });
      const audioUrl = generatedAudioUrl(result);
      if (!audioUrl) throw new Error("Grok TTS não retornou uma URL de áudio.");

      const response = await fetch(audioUrl);
      if (!response.ok || !response.body) throw new Error("Falha ao recuperar o áudio gerado.");

      return new Response(response.body, {
        headers: {
          ...audioHeaders("grok"),
          "content-type": response.headers.get("content-type") || "audio/mpeg",
        },
      });
    } catch (error) {
      grokError = error;
    }
  }

  let auraError: unknown = null;
  try {
    return await auraAudio(body, env);
  } catch (error) {
    auraError = error;
  }

  try {
    return await melottsAudio(body, env);
  } catch (fallbackError) {
    console.error(
      JSON.stringify({
        message: "podcast audio generation failed",
        elevenLabsError: elevenLabsError instanceof Error ? elevenLabsError.message : String(elevenLabsError),
        grokError: grokError instanceof Error ? grokError.message : String(grokError),
        auraError: auraError instanceof Error ? auraError.message : String(auraError),
        fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      }),
    );
    return jsonError("Não foi possível gerar o áudio do podcast agora.", 502);
  }
}

function parsePositiveLimit(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((midnight - now.getTime()) / 1_000));
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function identifyRequest(request: Request): Promise<RequestIdentity> {
  const accessEmail = request.headers
    .get("cf-access-authenticated-user-email")
    ?.trim()
    .toLowerCase();
  if (accessEmail) {
    return {
      id: await sha256(`cloudflare-access:${accessEmail}`),
      email: accessEmail,
      provider: "cloudflare-access",
      subject: accessEmail,
    };
  }

  const address = request.headers.get("cf-connecting-ip")?.trim() || "unknown";
  return {
    id: await sha256(`anonymous:${address}`),
    email: null,
    provider: "anonymous",
    subject: await sha256(address),
  };
}

async function reserveUsage(
  request: Request,
  env: Env,
): Promise<UsageReservation | null> {
  if (!env.DB) return null;
  await ensureUsageSchema(env.DB);

  const identity = await identifyRequest(request);
  const usageDate = utcDateKey();
  const now = new Date().toISOString();
  const userLimit = parsePositiveLimit(env.DAILY_USER_LIMIT);
  const globalLimit = parsePositiveLimit(env.DAILY_GLOBAL_LIMIT);

  await env.DB.prepare(
    `INSERT INTO users (id, email, auth_provider, external_subject, last_seen_at)
     VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       auth_provider = excluded.auth_provider,
       external_subject = excluded.external_subject,
       last_seen_at = excluded.last_seen_at`,
  )
    .bind(identity.id, identity.email, identity.provider, identity.subject, now)
    .run();

  const userUsage = await env.DB.prepare(
    `INSERT INTO daily_usage (user_id, usage_date, request_count, last_request_at)
     VALUES (?1, ?2, 1, ?3)
     ON CONFLICT(user_id, usage_date) DO UPDATE SET
       request_count = request_count + 1,
       last_request_at = excluded.last_request_at
     RETURNING request_count`,
  )
    .bind(identity.id, usageDate, now)
    .first<{ request_count: number }>();

  const globalUsage = await env.DB.prepare(
    `INSERT INTO global_daily_usage (usage_date, request_count, last_request_at)
     VALUES (?1, 1, ?2)
     ON CONFLICT(usage_date) DO UPDATE SET
       request_count = request_count + 1,
       last_request_at = excluded.last_request_at
     RETURNING request_count`,
  )
    .bind(usageDate, now)
    .first<{ request_count: number }>();

  return {
    identity,
    usageDate,
    userCount: Number(userUsage?.request_count ?? 1),
    globalCount: Number(globalUsage?.request_count ?? 1),
    userLimit,
    globalLimit,
  };
}

function usageLimitResponse(reservation: UsageReservation): Response | null {
  const userExceeded =
    reservation.userLimit !== null &&
    reservation.userCount > reservation.userLimit;
  const globalExceeded =
    reservation.globalLimit !== null &&
    reservation.globalCount > reservation.globalLimit;
  if (!userExceeded && !globalExceeded) return null;

  return Response.json(
    {
      error: userExceeded
        ? "Você atingiu o limite diário de perguntas. Tente novamente amanhã."
        : "A biblioteca atingiu o limite diário de uso. Tente novamente amanhã.",
      code: userExceeded ? "USER_DAILY_LIMIT" : "GLOBAL_DAILY_LIMIT",
    },
    {
      status: 429,
      headers: {
        ...JSON_HEADERS,
        "retry-after": String(secondsUntilUtcMidnight()),
      },
    },
  );
}

async function recordUsageOutcome(
  env: Env,
  reservation: UsageReservation | null,
  outcome: "success" | "error",
): Promise<void> {
  if (!env.DB || !reservation) return;
  const column = outcome === "success" ? "success_count" : "error_count";
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE daily_usage SET ${column} = ${column} + 1
       WHERE user_id = ?1 AND usage_date = ?2`,
    ).bind(reservation.identity.id, reservation.usageDate),
    env.DB.prepare(
      `UPDATE global_daily_usage SET ${column} = ${column} + 1
       WHERE usage_date = ?1`,
    ).bind(reservation.usageDate),
  ]);
}

function usageHeaders(reservation: UsageReservation | null): HeadersInit {
  if (!reservation) return {};
  const headers: Record<string, string> = {
    "x-usage-user-today": String(reservation.userCount),
    "x-usage-global-today": String(reservation.globalCount),
  };
  if (reservation.userLimit !== null) {
    headers["x-ratelimit-limit"] = String(reservation.userLimit);
    headers["x-ratelimit-remaining"] = String(
      Math.max(0, reservation.userLimit - reservation.userCount),
    );
  }
  return headers;
}

let usageSchemaReady: Promise<void> | null = null;

async function ensureUsageSchema(db: D1Database): Promise<void> {
  if (!usageSchemaReady) {
    usageSchemaReady = (async () => {
      const existing = await db
        .prepare(
          `SELECT COUNT(*) AS table_count
           FROM sqlite_master
           WHERE type = 'table'
             AND name IN ('users', 'daily_usage', 'global_daily_usage')`,
        )
        .first<{ table_count: number }>();
      if (Number(existing?.table_count ?? 0) === 3) return;

      await db.batch([
        db.prepare(
          `CREATE TABLE IF NOT EXISTS users (
             id TEXT PRIMARY KEY,
             email TEXT UNIQUE,
             auth_provider TEXT NOT NULL,
             external_subject TEXT,
             status TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'blocked')),
             created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
             last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
           )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS daily_usage (
             user_id TEXT NOT NULL,
             usage_date TEXT NOT NULL,
             request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
             success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
             error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
             last_request_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
             PRIMARY KEY (user_id, usage_date),
             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
           )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS global_daily_usage (
             usage_date TEXT PRIMARY KEY,
             request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
             success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
             error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
             last_request_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
           )`,
        ),
        db.prepare(
          "CREATE INDEX IF NOT EXISTS users_last_seen_idx ON users(last_seen_at DESC)",
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS users_provider_subject_idx
           ON users(auth_provider, external_subject)`,
        ),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS daily_usage_date_idx
           ON daily_usage(usage_date, request_count DESC)`,
        ),
      ]);
    })().catch((error) => {
      usageSchemaReady = null;
      throw error;
    });
  }
  await usageSchemaReady;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json(
        { ok: true, service: "playground-rag" },
        { headers: JSON_HEADERS },
      );
    }

    if (url.pathname === "/api/podcast/audio") {
      return podcastAudio(request, env);
    }

    if (url.pathname !== "/api/chat") {
      return jsonError("Rota não encontrada.", 404);
    }

    if (request.method !== "POST") {
      return new Response(null, {
        status: 405,
        headers: { allow: "POST", "cache-control": "no-store" },
      });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 32_000) {
      return jsonError("A conversa excedeu o limite permitido.", 413);
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return jsonError("JSON inválido.", 400);
    }

    if (JSON.stringify(rawBody).length > 32_000) {
      return jsonError("A conversa excedeu o limite permitido.", 413);
    }

    const body = parseChatBody(rawBody);
    if (!body) {
      return jsonError("Envie uma conversa válida terminando com uma pergunta.", 400);
    }

    let reservation: UsageReservation | null = null;
    try {
      reservation = await reserveUsage(request, env);
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "D1 usage reservation failed",
          error: error instanceof Error ? error.message : String(error),
          path: url.pathname,
        }),
      );
      return jsonError("O controle de uso está temporariamente indisponível.", 503);
    }

    if (reservation) {
      const limitResponse = usageLimitResponse(reservation);
      if (limitResponse) return limitResponse;
    }

    const localArithmetic = parseLocalArithmetic(body.messages);
    if (localArithmetic) {
      const answer = localArithmeticAnswer(localArithmetic, body.messages);
      console.log(JSON.stringify({ message: "local arithmetic completed", path: url.pathname }));
      ctx.waitUntil(recordUsageOutcome(env, reservation, "success"));
      return sseTextResponse(answer, [], usageHeaders(reservation));
    }

    try {
      const exactPage = parseExactPageRequest(body.messages);
      if (exactPage) {
        const response = await exactPageResponse(exactPage, env, usageHeaders(reservation));
        ctx.waitUntil(recordUsageOutcome(env, reservation, "success"));
        return response;
      }

      const stream = await env.AI_SEARCH.chatCompletions({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...body.messages,
        ],
        stream: true,
      });

      console.log(
        JSON.stringify({
          message: "chat completed",
          path: url.pathname,
          conversationMessages: body.messages.length,
        }),
      );

      ctx.waitUntil(recordUsageOutcome(env, reservation, "success"));

      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-store",
          "x-content-type-options": "nosniff",
          ...usageHeaders(reservation),
        },
      });
    } catch (error) {
      const details =
        error instanceof Error
          ? Object.fromEntries(
              Object.getOwnPropertyNames(error).map((key) => [
                key,
                String((error as unknown as Record<string, unknown>)[key]),
              ]),
            )
          : { value: String(error) };

      console.error(
        JSON.stringify({
          message: "AI Search request failed",
          error: details,
          path: url.pathname,
        }),
      );

      if (!parseExactPageRequest(body.messages)) {
        try {
          const fallbackStream = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
            messages: [
              { role: "system", content: FALLBACK_SYSTEM_PROMPT },
              ...body.messages,
            ],
            stream: true,
          });

          console.log(
            JSON.stringify({
              message: "chat fallback completed",
              path: url.pathname,
              conversationMessages: body.messages.length,
            }),
          );

          ctx.waitUntil(recordUsageOutcome(env, reservation, "success"));
          return new Response(fallbackStream, {
            headers: {
              "content-type": "text/event-stream; charset=utf-8",
              "cache-control": "no-cache, no-store",
              "x-content-type-options": "nosniff",
              "x-playground-answer-source": "workers-ai-fallback",
              ...usageHeaders(reservation),
            },
          });
        } catch (fallbackError) {
          console.error(
            JSON.stringify({
              message: "Workers AI chat fallback failed",
              error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
              path: url.pathname,
            }),
          );
        }
      }

      ctx.waitUntil(recordUsageOutcome(env, reservation, "error"));
      return jsonError("Não foi possível consultar a biblioteca agora.", 502);
    }
  },
} satisfies ExportedHandler<Env>;
