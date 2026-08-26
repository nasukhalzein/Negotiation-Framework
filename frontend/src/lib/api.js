const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export async function analyzeInput(input) {
  const res = await fetch(`${API}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Analyze failed");
  return res.json();
}

export async function getMeta(lang) {
  const res = await fetch(`${API}/meta?lang=${lang}`);
  if (!res.ok) throw new Error("Meta failed");
  return res.json();
}

export async function saveSession(input, analysis) {
  const res = await fetch(`${API}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, analysis }),
  });
  if (!res.ok) throw new Error("Save failed");
  return res.json();
}

export async function streamAi({ input, analysis, mode }, onDelta, onDone, onError) {
  let completed = false;
  try {
    const res = await fetch(`${API}/ai/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, analysis, mode }),
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const line = part.replace(/^data: /, "").trim();
        if (!line) continue;
        try {
          const payload = JSON.parse(line);
          if (payload.delta) onDelta(payload.delta);
          if (payload.error) onError(payload.error);
          if (payload.done) {
            completed = true;
            onDone(true);
          }
        } catch (e) {
          /* partial chunk */
        }
      }
    }
    if (!completed) onDone(false);
  } catch (e) {
    onError(e.message);
  }
}
