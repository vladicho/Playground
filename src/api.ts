type ApiLanguage = "pt" | "es";
type ApiMessage = {
  role: "user" | "assistant";
  content: string;
};

type ApiEnv = {
  AI_SEARCH: AiSearchInstance;
  DB: D1Database;
  MATHPLAYGROUND_API_KEY?: string;
  ALLOWED_ORIGINS?: string;
  DAILY_API_CLIENT_LIMIT?: string;
  DAILY_API_GLOBAL_LIMIT?: string;
};

type ApiUsage = {
  clientId: string;
  usageDate: string;
  clientCount: number;
  globalCount: number;
  clientLimit: number | null;
  globalLimit: number | null;
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
} as const;

const SYSTEM_PROMPTS: Record<ApiLanguage, string> = {
  pt: `Você é a API MathPlayground, especializada em matemática e fundamentada na Biblioteca Matemática.
Responda em português. Use os documentos recuperados para sustentar conceitos, enunciados e fatos.
Mostre cálculos passo a passo, diferencie informações da fonte de deduções próprias e termine problemas com "Resposta final: ...".
Use LaTeX delimitado por $...$ ou $$...$$. Não invente fontes, títulos, páginas ou exercícios.`,
  es: `Eres la API MathPlayground, especializada en matemáticas y fundamentada en la Biblioteca Matemática.
Responde en español. Usa los documentos recuperados para respaldar conceptos, enunciados y hechos.
Muestra los cálculos paso a paso, distingue la información de la fuente de tus propias deducciones y termina los problemas con "Respuesta final: ...".
Usa LaTeX delimitado por $...$ o $$...$$. No inventes fuentes, títulos, páginas ni ejercicios.`,
};

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(data, {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function apiError(
  message: string,
  code: string,
  status: number,
  requestId: string,
  headers: HeadersInit = {},
): Response {
  return json({ error: { message, code }, request_id: requestId }, status, headers);
}

function parsePositiveLimit(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function utcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1_000));
}

function nextUtcMidnight(): string {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  )).toISOString();
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] || null;
}

async function authenticate(
  request: Request,
  env: ApiEnv,
  requestId: string,
): Promise<{ token: string; clientId: string } | Response> {
  if (!env.MATHPLAYGROUND_API_KEY) {
    return apiError(
      "A API ainda não possui uma chave configurada.",
      "API_NOT_CONFIGURED",
      503,
      requestId,
    );
  }
  const token = bearerToken(request);
  if (!token || !(await secretsMatch(token, env.MATHPLAYGROUND_API_KEY))) {
    return apiError(
      "Chave de API ausente ou inválida.",
      "UNAUTHORIZED",
      401,
      requestId,
      { "www-authenticate": "Bearer" },
    );
  }
  return { token, clientId: await sha256(`mathplayground-api:${token}`) };
}

function allowedOrigin(request: Request, env: ApiEnv): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function withCors(response: Response, request: Request, env: ApiEnv): Response {
  const origin = allowedOrigin(request, env);
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-expose-headers", "x-request-id,x-ratelimit-limit,x-ratelimit-remaining,retry-after");
  headers.append("vary", "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function preflight(request: Request, env: ApiEnv, requestId: string): Response {
  const origin = allowedOrigin(request, env);
  if (!origin) return apiError("Origem não permitida.", "ORIGIN_NOT_ALLOWED", 403, requestId);
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-max-age": "86400",
      vary: "Origin",
    },
  });
}

async function ensureApiSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS api_clients (
         id TEXT PRIMARY KEY,
         label TEXT NOT NULL DEFAULT 'default',
         status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
         created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
         last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
       )`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS api_daily_usage (
         client_id TEXT NOT NULL,
         usage_date TEXT NOT NULL,
         request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
         success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
         error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
         last_request_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
         PRIMARY KEY (client_id, usage_date),
         FOREIGN KEY (client_id) REFERENCES api_clients(id) ON DELETE CASCADE
       )`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS api_global_daily_usage (
         usage_date TEXT PRIMARY KEY,
         request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
         success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
         error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
         last_request_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
       )`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS api_daily_usage_date_idx
       ON api_daily_usage(usage_date, request_count DESC)`,
    ),
  ]);
}

async function reserveUsage(clientId: string, env: ApiEnv): Promise<ApiUsage | Response> {
  await ensureApiSchema(env.DB);
  const now = new Date().toISOString();
  const usageDate = utcDateKey();
  const clientLimit = parsePositiveLimit(env.DAILY_API_CLIENT_LIMIT);
  const globalLimit = parsePositiveLimit(env.DAILY_API_GLOBAL_LIMIT);

  await env.DB.prepare(
    `INSERT INTO api_clients (id, last_seen_at)
     VALUES (?1, ?2)
     ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
  ).bind(clientId, now).run();

  const client = await env.DB.prepare(
    "SELECT status FROM api_clients WHERE id = ?1",
  ).bind(clientId).first<{ status: string }>();
  if (client?.status === "blocked") {
    return json({ error: { message: "Cliente de API bloqueado.", code: "CLIENT_BLOCKED" } }, 403);
  }

  const clientUsage = await env.DB.prepare(
    `INSERT INTO api_daily_usage (client_id, usage_date, request_count, last_request_at)
     VALUES (?1, ?2, 1, ?3)
     ON CONFLICT(client_id, usage_date) DO UPDATE SET
       request_count = request_count + 1,
       last_request_at = excluded.last_request_at
     RETURNING request_count`,
  ).bind(clientId, usageDate, now).first<{ request_count: number }>();

  const globalUsage = await env.DB.prepare(
    `INSERT INTO api_global_daily_usage (usage_date, request_count, last_request_at)
     VALUES (?1, 1, ?2)
     ON CONFLICT(usage_date) DO UPDATE SET
       request_count = request_count + 1,
       last_request_at = excluded.last_request_at
     RETURNING request_count`,
  ).bind(usageDate, now).first<{ request_count: number }>();

  return {
    clientId,
    usageDate,
    clientCount: Number(clientUsage?.request_count ?? 1),
    globalCount: Number(globalUsage?.request_count ?? 1),
    clientLimit,
    globalLimit,
  };
}

function usageHeaders(usage: ApiUsage): Record<string, string> {
  const headers: Record<string, string> = {
    "x-usage-client-today": String(usage.clientCount),
    "x-usage-global-today": String(usage.globalCount),
  };
  if (usage.clientLimit !== null) {
    headers["x-ratelimit-limit"] = String(usage.clientLimit);
    headers["x-ratelimit-remaining"] = String(
      Math.max(0, usage.clientLimit - usage.clientCount),
    );
  }
  return headers;
}

function limitResponse(usage: ApiUsage, requestId: string): Response | null {
  const clientExceeded = usage.clientLimit !== null && usage.clientCount > usage.clientLimit;
  const globalExceeded = usage.globalLimit !== null && usage.globalCount > usage.globalLimit;
  if (!clientExceeded && !globalExceeded) return null;
  return apiError(
    clientExceeded ? "Limite diário da chave atingido." : "Limite diário global atingido.",
    clientExceeded ? "CLIENT_DAILY_LIMIT" : "GLOBAL_DAILY_LIMIT",
    429,
    requestId,
    { ...usageHeaders(usage), "retry-after": String(secondsUntilUtcMidnight()) },
  );
}

async function recordOutcome(
  env: ApiEnv,
  usage: ApiUsage,
  outcome: "success" | "error",
): Promise<void> {
  const column = outcome === "success" ? "success_count" : "error_count";
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE api_daily_usage SET ${column} = ${column} + 1
       WHERE client_id = ?1 AND usage_date = ?2`,
    ).bind(usage.clientId, usage.usageDate),
    env.DB.prepare(
      `UPDATE api_global_daily_usage SET ${column} = ${column} + 1
       WHERE usage_date = ?1`,
    ).bind(usage.usageDate),
  ]);
}

function isMessage(value: unknown): value is ApiMessage {
  if (typeof value !== "object" || value === null) return false;
  const record = value as { role?: unknown; content?: unknown };
  return (
    (record.role === "user" || record.role === "assistant") &&
    typeof record.content === "string" &&
    record.content.trim().length > 0 &&
    record.content.length <= 4_000
  );
}

function languageFrom(value: unknown): ApiLanguage {
  return value === "es" ? "es" : "pt";
}

async function readJsonObject(
  request: Request,
  requestId: string,
): Promise<Record<string, unknown> | Response> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 32_000) {
    return apiError("Corpo da requisição muito grande.", "PAYLOAD_TOO_LARGE", 413, requestId);
  }
  try {
    const value: unknown = await request.json();
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error();
    if (JSON.stringify(value).length > 32_000) {
      return apiError("Corpo da requisição muito grande.", "PAYLOAD_TOO_LARGE", 413, requestId);
    }
    return value as Record<string, unknown>;
  } catch {
    return apiError("JSON inválido.", "INVALID_JSON", 400, requestId);
  }
}

function publicSource(chunk: AiSearchSearchResponse["chunks"][number]) {
  const metadata = chunk.item.metadata;
  const page = metadata?.page ?? metadata?.page_number ?? metadata?.pageNumber ?? null;
  return {
    document: chunk.item.key.split("/").at(-1) || chunk.item.key,
    page,
    score: chunk.score,
    excerpt: chunk.text.replace(/\s+/g, " ").trim().slice(0, 500),
  };
}

async function completionResponse(
  messages: ApiMessage[],
  language: ApiLanguage,
  stream: boolean,
  env: ApiEnv,
  ctx: ExecutionContext,
  usage: ApiUsage,
  requestId: string,
): Promise<Response> {
  const allMessages = [
    { role: "system" as const, content: SYSTEM_PROMPTS[language] },
    ...messages,
  ];
  if (stream) {
    const body = await env.AI_SEARCH.chatCompletions({ messages: allMessages, stream: true });
    ctx.waitUntil(recordOutcome(env, usage, "success"));
    return new Response(body, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-store",
        "x-content-type-options": "nosniff",
        "x-request-id": requestId,
        ...usageHeaders(usage),
      },
    });
  }

  const result = await env.AI_SEARCH.chatCompletions({ messages: allMessages, stream: false });
  const answer = result.choices[0]?.message.content;
  if (!answer) throw new Error("AI Search returned an empty answer");
  ctx.waitUntil(recordOutcome(env, usage, "success"));
  return json(
    {
      id: result.id || requestId,
      answer,
      language,
      sources: result.chunks.map(publicSource),
      request_id: requestId,
    },
    200,
    { "x-request-id": requestId, ...usageHeaders(usage) },
  );
}

async function handleChat(
  request: Request,
  env: ApiEnv,
  ctx: ExecutionContext,
  usage: ApiUsage,
  requestId: string,
): Promise<Response> {
  const body = await readJsonObject(request, requestId);
  if (body instanceof Response) return body;
  if (!Array.isArray(body.messages)) {
    return apiError("O campo messages é obrigatório.", "INVALID_MESSAGES", 400, requestId);
  }
  const messages = body.messages.slice(-12);
  if (messages.length === 0 || !messages.every(isMessage) || messages.at(-1)?.role !== "user") {
    return apiError("Envie mensagens válidas terminando com uma pergunta.", "INVALID_MESSAGES", 400, requestId);
  }
  return completionResponse(
    messages,
    languageFrom(body.language),
    body.stream === true,
    env,
    ctx,
    usage,
    requestId,
  );
}

async function handleSolve(
  request: Request,
  env: ApiEnv,
  ctx: ExecutionContext,
  usage: ApiUsage,
  requestId: string,
): Promise<Response> {
  const body = await readJsonObject(request, requestId);
  if (body instanceof Response) return body;
  if (typeof body.problem !== "string" || !body.problem.trim() || body.problem.length > 4_000) {
    return apiError("O campo problem é obrigatório.", "INVALID_PROBLEM", 400, requestId);
  }
  const language = languageFrom(body.language);
  const instruction = language === "es"
    ? `Resuelve paso a paso el siguiente problema usando la biblioteca cuando sea pertinente:\n\n${body.problem.trim()}`
    : `Resolva passo a passo o problema a seguir usando a biblioteca quando pertinente:\n\n${body.problem.trim()}`;
  return completionResponse(
    [{ role: "user", content: instruction }],
    language,
    body.stream === true,
    env,
    ctx,
    usage,
    requestId,
  );
}

async function handleQuiz(
  request: Request,
  env: ApiEnv,
  ctx: ExecutionContext,
  usage: ApiUsage,
  requestId: string,
): Promise<Response> {
  const body = await readJsonObject(request, requestId);
  if (body instanceof Response) return body;
  if (typeof body.topic !== "string" || !body.topic.trim() || body.topic.length > 500) {
    return apiError("O campo topic é obrigatório.", "INVALID_TOPIC", 400, requestId);
  }
  const language = languageFrom(body.language);
  const requested = typeof body.questions === "number" ? Math.trunc(body.questions) : 5;
  const questions = Math.max(1, Math.min(requested, 10));
  const instruction = language === "es"
    ? `Crea un cuestionario sobre "${body.topic.trim()}" con ${questions} preguntas objetivas, cuatro opciones por pregunta y respuestas comentadas, usando los documentos recuperados.`
    : `Crie um quiz sobre "${body.topic.trim()}" com ${questions} questões objetivas, quatro alternativas por questão e gabarito comentado, usando os documentos recuperados.`;
  return completionResponse(
    [{ role: "user", content: instruction }],
    language,
    body.stream === true,
    env,
    ctx,
    usage,
    requestId,
  );
}

async function handleSearch(
  request: Request,
  env: ApiEnv,
  ctx: ExecutionContext,
  usage: ApiUsage,
  requestId: string,
): Promise<Response> {
  const body = await readJsonObject(request, requestId);
  if (body instanceof Response) return body;
  if (typeof body.query !== "string" || !body.query.trim() || body.query.length > 2_000) {
    return apiError("O campo query é obrigatório.", "INVALID_QUERY", 400, requestId);
  }
  const result = await env.AI_SEARCH.search({ query: body.query.trim() });
  ctx.waitUntil(recordOutcome(env, usage, "success"));
  return json(
    {
      query: result.search_query,
      results: result.chunks.map(publicSource),
      request_id: requestId,
    },
    200,
    { "x-request-id": requestId, ...usageHeaders(usage) },
  );
}

async function handleUsage(clientId: string, env: ApiEnv, requestId: string): Promise<Response> {
  await ensureApiSchema(env.DB);
  const usageDate = utcDateKey();
  const [client, global] = await Promise.all([
    env.DB.prepare(
      `SELECT request_count AS clientCount FROM api_daily_usage
       WHERE client_id = ?1 AND usage_date = ?2`,
    ).bind(clientId, usageDate).first<{ clientCount: number }>(),
    env.DB.prepare(
      `SELECT request_count AS globalCount FROM api_global_daily_usage
       WHERE usage_date = ?1`,
    ).bind(usageDate).first<{ globalCount: number }>(),
  ]);
  return json({
    date: usageDate,
    client_requests: Number(client?.clientCount ?? 0),
    global_requests: Number(global?.globalCount ?? 0),
    client_limit: parsePositiveLimit(env.DAILY_API_CLIENT_LIMIT),
    global_limit: parsePositiveLimit(env.DAILY_API_GLOBAL_LIMIT),
    resets_at: nextUtcMidnight(),
    request_id: requestId,
  });
}

function openApiDocument(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "MathPlayground API",
      version: "1.0.0",
      description: "API bilíngue para consultar a Biblioteca Matemática com RAG.",
    },
    servers: [{ url: origin }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
    paths: {
      "/v1/health": { get: { summary: "Verificar disponibilidade" } },
      "/v1/chat": { post: { summary: "Conversar com a biblioteca", security: [{ bearerAuth: [] }] } },
      "/v1/search": { post: { summary: "Buscar trechos no RAG", security: [{ bearerAuth: [] }] } },
      "/v1/solve": { post: { summary: "Resolver um problema", security: [{ bearerAuth: [] }] } },
      "/v1/quiz": { post: { summary: "Gerar um quiz", security: [{ bearerAuth: [] }] } },
      "/v1/usage": { get: { summary: "Consultar consumo diário", security: [{ bearerAuth: [] }] } },
    },
  };
}

export default {
  async fetch(request: Request, env: ApiEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();

    if (request.method === "OPTIONS") return preflight(request, env, requestId);

    if (request.method === "GET" && url.pathname === "/") {
      return withCors(json({
        name: "MathPlayground API",
        version: "v1",
        status: "ok",
        documentation: `${url.origin}/v1/openapi.json`,
      }), request, env);
    }
    if (request.method === "GET" && url.pathname === "/v1/health") {
      return withCors(json({ ok: true, service: "mathplayground-api", request_id: requestId }), request, env);
    }
    if (request.method === "GET" && url.pathname === "/v1/openapi.json") {
      return withCors(json(openApiDocument(url.origin)), request, env);
    }

    const authenticated = await authenticate(request, env, requestId);
    if (authenticated instanceof Response) return withCors(authenticated, request, env);

    if (request.method === "GET" && url.pathname === "/v1/usage") {
      try {
        return withCors(await handleUsage(authenticated.clientId, env, requestId), request, env);
      } catch (error) {
        console.error(JSON.stringify({ message: "usage query failed", requestId, error: error instanceof Error ? error.message : String(error) }));
        return withCors(apiError("Não foi possível consultar o consumo.", "USAGE_ERROR", 503, requestId), request, env);
      }
    }

    const handler = request.method === "POST"
      ? {
          "/v1/chat": handleChat,
          "/v1/search": handleSearch,
          "/v1/solve": handleSolve,
          "/v1/quiz": handleQuiz,
        }[url.pathname]
      : undefined;
    if (!handler) {
      return withCors(apiError("Rota não encontrada.", "NOT_FOUND", 404, requestId), request, env);
    }

    let usage: ApiUsage | null = null;
    try {
      const reserved = await reserveUsage(authenticated.clientId, env);
      if (reserved instanceof Response) return withCors(reserved, request, env);
      usage = reserved;
      const limited = limitResponse(usage, requestId);
      if (limited) return withCors(limited, request, env);
      const response = await handler(request, env, ctx, usage, requestId);
      return withCors(response, request, env);
    } catch (error) {
      if (usage) ctx.waitUntil(recordOutcome(env, usage, "error"));
      console.error(JSON.stringify({
        message: "MathPlayground API request failed",
        requestId,
        path: url.pathname,
        error: error instanceof Error ? error.message : String(error),
      }));
      return withCors(apiError("Falha ao consultar a biblioteca.", "UPSTREAM_ERROR", 502, requestId), request, env);
    }
  },
} satisfies ExportedHandler<ApiEnv>;
