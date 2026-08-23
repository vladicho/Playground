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

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatBody = {
  messages: ClientMessage[];
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
    record.content.length <= 4_000
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json(
        { ok: true, service: "playground-rag" },
        { headers: JSON_HEADERS },
      );
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

    try {
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
      ctx.waitUntil(recordUsageOutcome(env, reservation, "error"));
      return jsonError("Não foi possível consultar a biblioteca agora.", 502);
    }
  },
} satisfies ExportedHandler<Env>;
