/** Answer engines shown on AI Visibility. Live checks use DataForSEO LLM Responses. */
export const AI_VISIBILITY_LIVE_ENGINES = ["ChatGPT", "Gemini", "Perplexity", "Claude"];

/** Extra engines in the picker (live endpoint not available yet). */
export const AI_VISIBILITY_SOON_ENGINES = ["Copilot", "Google AI Overviews", "Grok"];

export const AI_VISIBILITY_ENGINES = [...AI_VISIBILITY_LIVE_ENGINES, ...AI_VISIBILITY_SOON_ENGINES];

export function isLiveAiEngine(name) {
  return AI_VISIBILITY_LIVE_ENGINES.includes(name);
}
