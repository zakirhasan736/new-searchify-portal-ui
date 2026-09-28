import { authHeaders } from "@/utils/users/Helpers";

export async function loadFeatures(kind) {
  try {
    const response = await fetch(`/api/v1/features/${kind}`, { headers: authHeaders() });
    if (response.ok) return response.json();
  } catch {
    /* live-only: never fall back to demo feeds */
  }
  return [];
}

export async function saveFeature(kind, title, payload) {
  const response = await fetch(`/api/v1/features/${kind}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, payload }),
  });
  return response;
}

/** Calls backend OpenAI draft worker (Astra auto-routed). */
export async function createAiDraft({ kind, brief, writingType, tokens, forceAstra = false }) {
  const response = await fetch("/api/v1/drafts", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      kind,
      brief,
      writing_type: writingType || "",
      tokens: tokens ? Number(tokens) : undefined,
      force_astra: Boolean(forceAstra),
    }),
  });
  return response;
}

export async function approveDraft(draftId) {
  return fetch(`/api/v1/drafts/${draftId}/approve`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function enrichFromGoogle() {
  return fetch("/api/v1/oauth/google/enrich", {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function crawlOnPageFix(link) {
  return fetch("/api/v1/crawl/on-page-fix", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ link }),
  });
}

export async function queueDraftForCms({ draftId, targetUrl = "", execute = false, forceDryRun = true }) {
  return fetch("/api/v1/operator/changes/from-draft", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      draft_id: draftId,
      target_url: targetUrl,
      auto_approve: true,
      execute,
      force_dry_run: forceDryRun,
    }),
  });
}

export async function operatorApproveChange(changeId) {
  return fetch(`/api/v1/operator/changes/${changeId}/approve`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function operatorExecuteChange(changeId, { forceDryRun = false } = {}) {
  return fetch(`/api/v1/operator/changes/${changeId}/execute`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ force_dry_run: forceDryRun }),
  });
}
