import { findSimilarTickets } from "./rag.js";
import { generateResponse } from "./llmService.js";
import { getCached, setCached } from "./responseCache.js";

const DIRECT_RETRIEVAL_THRESHOLD = 0.92;
const GROUNDED_GENERATION_THRESHOLD = 0.75;

export async function handleTicketQuery(userQuery) {
  const cached = getCached(userQuery);
  if (cached) {
    return { ...cached, source: `${cached.source}_cached` };
  }

  const results = await findSimilarTickets(userQuery, 5);
  const topScore = results[0]?.score ?? 0;

  let result;

  if (topScore >= DIRECT_RETRIEVAL_THRESHOLD) {
    result = {
      response: results[0].response,
      source: "retrieval_direct",
      needsHumanReview: false,
      matchedScore: topScore,
    };
  } else {
    const context = results
      .filter((r) => r.score >= 0.6)
      .map((r) => `Past query: ${r.title}\nResolution: ${r.response}`)
      .join("\n\n");

    const llmResponse = await generateResponse(userQuery, context, topScore);

    if (!llmResponse) {
      result = results[0]
        ? {
            response: results[0].response,
            source: "retrieval_fallback",
            needsHumanReview: true,
            matchedScore: topScore,
          }
        : {
            response: null,
            source: "no_match_no_llm",
            needsHumanReview: true,
            matchedScore: 0,
          };
    } else {
      result = {
        response: llmResponse,
        source: "llm_generated",
        needsHumanReview: topScore < GROUNDED_GENERATION_THRESHOLD,
        matchedScore: topScore,
      };
    }
  }

  setCached(userQuery, result);
  return result;
}