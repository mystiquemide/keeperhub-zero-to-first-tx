import { createHash } from "node:crypto";

export const DEFAULT_BASE_URL = "https://app.keeperhub.com";

export function assertOrganizationKey(key) {
  if (!key) throw new Error("KEEPERHUB_API_KEY is required");
  if (!key.startsWith("kh_")) {
    throw new Error("KEEPERHUB_API_KEY must be an organization key with the kh_ prefix");
  }
}

export function canonicalizeAmount(input) {
  const raw = String(input ?? "").trim();
  if (!raw) throw new Error("amount is required");
  if (raw.startsWith("+") || raw.startsWith("-")) {
    throw new Error("amount must be unsigned");
  }
  if (/e/i.test(raw)) throw new Error("amount must not use exponent notation");
  if (!/^\d*(?:\.\d*)?$/.test(raw)) throw new Error("amount must be a decimal string");

  let [whole = "", fraction = ""] = raw.split(".");
  if (!whole) whole = "0";
  whole = whole.replace(/^0+(?=\d)/, "");
  fraction = fraction.replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole || "0";
}

function encodeTaskId(taskId) {
  const trimmed = String(taskId ?? "").trim();
  if (!trimmed) throw new Error("TASK_ID is required for execution");
  return trimmed.replaceAll("%", "%25").replaceAll("|", "%7C");
}

export function stableTransferIdempotencyKey({
  taskId,
  chainId,
  recipientAddress,
  amount,
  tokenAddress = "",
}) {
  const normalized = [
    encodeTaskId(taskId),
    String(Number(chainId)),
    String(recipientAddress).trim().toLowerCase(),
    canonicalizeAmount(amount),
    String(tokenAddress ?? "").trim().toLowerCase(),
  ].join("|");

  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function transferRequestBody({ chainId, recipientAddress, amount, tokenAddress }) {
  const body = {
    chainId: Number(chainId),
    recipientAddress: String(recipientAddress).trim(),
    amount: canonicalizeAmount(amount),
  };
  if (tokenAddress) body.tokenAddress = String(tokenAddress).trim();
  return body;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function requestJson(url, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, options);
  const body = await parseResponse(response);
  return { response, body };
}

export function authHeaders(key, extra = {}) {
  return {
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

export async function checkApiKey({ key, baseUrl = DEFAULT_BASE_URL, fetchImpl = fetch }) {
  assertOrganizationKey(key);
  return requestJson(
    `${baseUrl}/api/keys`,
    { headers: authHeaders(key) },
    fetchImpl,
  );
}

export async function listChains({ baseUrl = DEFAULT_BASE_URL, fetchImpl = fetch } = {}) {
  const { response, body } = await requestJson(`${baseUrl}/api/chains`, {}, fetchImpl);
  if (!response.ok) throw new Error(`GET /api/chains failed with HTTP ${response.status}`);
  if (!Array.isArray(body)) throw new Error("GET /api/chains returned an unexpected response shape");
  return body;
}

export function findChain(chains, chainId) {
  return chains.find((chain) => Number(chain.chainId) === Number(chainId));
}

export async function simulateTransfer({
  key,
  body,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = fetch,
}) {
  return requestJson(
    `${baseUrl}/api/execute/transfer`,
    {
      method: "POST",
      headers: authHeaders(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ ...body, simulate: true }),
    },
    fetchImpl,
  );
}

export async function executeTransfer({
  key,
  body,
  idempotencyKey,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = fetch,
}) {
  return requestJson(
    `${baseUrl}/api/execute/transfer`,
    {
      method: "POST",
      headers: authHeaders(key, {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      }),
      body: JSON.stringify(body),
    },
    fetchImpl,
  );
}

export async function getDirectExecutionStatus({
  key,
  executionId,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = fetch,
}) {
  return requestJson(
    `${baseUrl}/api/execute/${encodeURIComponent(executionId)}/status`,
    { headers: authHeaders(key) },
    fetchImpl,
  );
}

const TERMINAL = new Set(["completed", "error", "failed", "system_error", "cancelled"]);

export async function pollDirectExecution({
  key,
  executionId,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = fetch,
  timeoutMs = 5 * 60 * 1000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await getDirectExecutionStatus({ key, executionId, baseUrl, fetchImpl });
    if (!result.response.ok) {
      throw new Error(`status lookup failed with HTTP ${result.response.status}`);
    }

    const status = result.body?.status;
    const hint = Number(result.response.headers.get("x-poll-interval-hint"));
    if (TERMINAL.has(status)) return result;

    // KeeperHub documents unconfirmed as non-terminal: never rebroadcast merely because
    // the receipt is not readable yet.
    const waitSeconds = Number.isFinite(hint) && hint >= 0 ? hint : 2;
    await sleep(Math.max(waitSeconds, 1) * 1000);
  }

  throw new Error(`execution ${executionId} did not reach a terminal state before timeout`);
}

export function extractTransactionProof(statusBody) {
  const receipts = Array.isArray(statusBody?.receipts) ? statusBody.receipts : [];
  const receipt = receipts.find((item) => item?.transactionHash) ?? receipts[0] ?? null;
  const transactionHash =
    statusBody?.transactionHash ??
    receipt?.transactionHash ??
    receipt?.hash ??
    null;
  const transactionLink = statusBody?.transactionLink ?? receipt?.transactionLink ?? null;

  return {
    transactionHash,
    transactionLink,
    receipt,
  };
}

export async function verifyTransactionReceipt({ rpcUrl, transactionHash, fetchImpl = fetch }) {
  if (!rpcUrl) return null;
  if (!transactionHash) throw new Error("transactionHash is required for RPC verification");

  const { response, body } = await requestJson(
    rpcUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [transactionHash],
      }),
    },
    fetchImpl,
  );

  if (!response.ok) throw new Error(`RPC receipt lookup failed with HTTP ${response.status}`);
  if (body?.error) throw new Error(`RPC error: ${body.error.message ?? JSON.stringify(body.error)}`);

  const receipt = body?.result;
  if (!receipt) return { found: false, success: false, receipt: null };
  return {
    found: true,
    success: receipt.status === "0x1",
    receipt,
  };
}
