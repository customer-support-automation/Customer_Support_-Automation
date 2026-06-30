const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL_NAME = process.env.OLLAMA_MODEL || "qwen2.5:3b-instruct-q4_K_M";

function buildPrompt(userQuery, retrievedContext, similarityScore) {
  const groundingNote =
    similarityScore >= 0.75
      ? `Reference these past resolved tickets as grounding context:\n\n${retrievedContext}\n\nAdapt the relevant information to answer the current query. Stay consistent with the tone and facts in the reference material.`
      : `No strong matching past tickets were found. Answer using general customer support best practices. Be honest that this may need human review if you are not confident.`;

  return `You are a professional, concise customer support assistant. Respond helpfully in 2-4 sentences unless more detail is clearly needed.

${groundingNote}

Customer query: ${userQuery}

Response:`;
}

export async function generateResponse(userQuery, retrievedContext, similarityScore) {
  const prompt = buildPrompt(userQuery, retrievedContext, similarityScore);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 300,
          top_p: 0.9,
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    const data = await res.json();
    return data.response?.trim() || null;
  } catch (err) {
    console.error("Local LLM generation failed:", err.message);
    return null;
  }
}

export async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return false;

    const data = await res.json();
    const hasModel = data.models?.some((m) => m.name.includes(MODEL_NAME.split(":")[0]));

    if (!hasModel) {
      console.warn(`Ollama is running but model ${MODEL_NAME} is not pulled. Run: ollama pull ${MODEL_NAME}`);
    }

    return true;
  } catch {
    console.warn("Ollama is not reachable at", OLLAMA_URL, "— is 'ollama serve' running?");
    return false;
  }
}