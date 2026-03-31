export default async function handler(request) {
  const start = Date.now();

  if (request.method !== "POST") {
    console.log("[search] 405 — non-POST request");
    return new Response("Method Not Allowed", { status: 405 });
  }

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) {
    console.error("[search] ANTHROPIC_API_KEY not set");
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY environment variable not set." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    console.error("[search] Invalid JSON body");
    return new Response(
      JSON.stringify({ error: "Invalid JSON body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log("[search] Request received", {
    model: body.model,
    max_tokens: body.max_tokens,
    tools: body.tools?.map((t) => t.name),
    message_length: JSON.stringify(body.messages).length,
  });

  // Enable streaming
  body.stream = true;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      const errMsg = data.error?.message || "Anthropic API error";
      console.error("[search] Anthropic API error", {
        status: response.status,
        error: errMsg,
        elapsed_ms: Date.now() - start,
      });
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[search] Streaming response started", {
      elapsed_ms: Date.now() - start,
    });

    // Wrap stream to log completion, errors, and final event data
    let lastEventData = "";
    let streamError = "";
    const transform = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        try {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            // Capture any error events in full
            if (data.includes('"type":"error"') || data.includes('"type": "error"')) {
              streamError = data;
            }
            lastEventData = data;
          }
        } catch { /* ignore decode errors */ }
      },
      flush() {
        console.log("[search] Stream completed", {
          elapsed_ms: Date.now() - start,
          last_event: lastEventData.substring(0, 500),
          ...(streamError && { stream_error: streamError.substring(0, 1000) }),
        });
      },
    });

    response.body.pipeTo(transform.writable).catch((err) => {
      console.error("[search] Stream pipe error", {
        error: String(err),
        error_message: err?.message,
        error_name: err?.name,
        elapsed_ms: Date.now() - start,
        last_event: lastEventData.substring(0, 500),
        ...(streamError && { stream_error: streamError.substring(0, 1000) }),
      });
    });

    return new Response(transform.readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("[search] Fetch error", {
      error: err.message,
      elapsed_ms: Date.now() - start,
    });
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const config = { path: "/.netlify/functions/search" };
