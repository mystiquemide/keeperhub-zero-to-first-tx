import {
  DEFAULT_BASE_URL,
  assertOrganizationKey,
  executeTransfer,
  extractTransactionProof,
  findChain,
  listChains,
  pollDirectExecution,
  simulateTransfer,
  stableTransferIdempotencyKey,
  transferRequestBody,
  verifyTransactionReceipt,
} from "../src/keeperhub.mjs";

const env = process.env;
const key = env.KEEPERHUB_API_KEY;
const baseUrl = env.KEEPERHUB_BASE_URL || DEFAULT_BASE_URL;
const chainId = Number(env.CHAIN_ID || 84532);
const recipientAddress = env.RECIPIENT_ADDRESS;
const tokenAddress = env.TOKEN_ADDRESS || "";
const amount = env.AMOUNT;
const execute = env.EXECUTE === "1";
const allowMainnet = env.ALLOW_MAINNET === "1";
const taskId = env.TASK_ID;
const rpcUrl = env.RPC_URL || "";

function stop(message) {
  console.error(`STOP  ${message}`);
  process.exit(1);
}

function info(label, value) {
  console.log(`${label.padEnd(12)} ${value}`);
}

try {
  assertOrganizationKey(key);
  if (!recipientAddress) stop("RECIPIENT_ADDRESS is required");
  if (!amount) stop("AMOUNT is required");

  const chains = await listChains({ baseUrl });
  const chain = findChain(chains, chainId);
  if (!chain) stop(`chain ${chainId} was not returned by GET /api/chains`);
  if (!chain.isEnabled) stop(`${chain.name} (${chain.chainId}) is currently disabled`);
  if (!chain.isTestnet && !allowMainnet) {
    stop(`refusing mainnet ${chain.name}; set ALLOW_MAINNET=1 only after intentionally reviewing the request`);
  }

  const body = transferRequestBody({ chainId, recipientAddress, amount, tokenAddress });

  console.log("KeeperHub safe first-write starter\n");
  info("chain", `${chain.name} (${chain.chainId})${chain.isTestnet ? " [testnet]" : " [MAINNET]"}`);
  info("recipient", body.recipientAddress);
  info("asset", body.tokenAddress || chain.symbol || "native token");
  info("amount", body.amount);
  info("mode", execute ? "simulate, then execute" : "simulation only");

  console.log("\n1. Simulating the exact request body...");
  const simulation = await simulateTransfer({ key, body, baseUrl });
  const simBody = simulation.body ?? {};

  if (simBody.wouldRevert === true) {
    stop(`simulation would revert${simBody.revertReason ? `: ${simBody.revertReason}` : ""}`);
  }
  if (!simulation.response.ok || simBody.success !== true) {
    stop(`simulation did not report success (HTTP ${simulation.response.status})`);
  }

  console.log("PASS  simulation succeeded and wouldRevert is not true");

  if (!execute) {
    console.log("\nSAFE STOP  No transaction was broadcast.");
    console.log("Set EXECUTE=1 and a stable TASK_ID when you are ready to perform the write.");
    process.exit(0);
  }

  if (!taskId) stop("TASK_ID is required when EXECUTE=1 so retries reuse a stable execution identity");

  const idempotencyKey = stableTransferIdempotencyKey({
    taskId,
    chainId,
    recipientAddress,
    amount,
    tokenAddress,
  });

  console.log("\n2. Broadcasting the same request body with a stable idempotency key...");
  const submitted = await executeTransfer({ key, body, idempotencyKey, baseUrl });
  if (!submitted.response.ok) {
    const code = submitted.body?.code ? ` ${submitted.body.code}` : "";
    stop(`broadcast returned HTTP ${submitted.response.status}${code}`);
  }

  const executionId = submitted.body?.executionId;
  if (!executionId) stop("broadcast response did not include executionId");
  info("executionId", executionId);
  if (submitted.body?.idempotentReplay === true) info("replay", "true (no new execution was created)");

  console.log("\n3. Waiting for KeeperHub to reach a terminal state...");
  const terminal = await pollDirectExecution({ key, executionId, baseUrl });
  info("status", terminal.body?.status ?? "unknown");

  if (terminal.body?.status !== "completed") {
    stop(`execution finished without completed status: ${terminal.body?.status ?? "unknown"}`);
  }

  const proof = extractTransactionProof(terminal.body);
  if (!proof.transactionHash) stop("completed execution did not expose a transaction hash");

  info("tx hash", proof.transactionHash);
  if (proof.transactionLink) info("explorer", proof.transactionLink);
  if (proof.receipt?.verified !== undefined) info("verified", String(proof.receipt.verified));
  if (proof.receipt?.receiptStatus) info("receipt", proof.receipt.receiptStatus);

  if (proof.receipt && (proof.receipt.verified !== true || proof.receipt.receiptStatus !== "success")) {
    stop("KeeperHub receipt evidence is not verified success");
  }

  if (rpcUrl) {
    console.log("\n4. Independently checking the same transaction through your RPC...");
    const rpc = await verifyTransactionReceipt({ rpcUrl, transactionHash: proof.transactionHash });
    if (!rpc.found) stop("RPC does not currently return a receipt for the transaction hash");
    if (!rpc.success) stop("RPC receipt exists but reports a reverted transaction");
    console.log("PASS  independent RPC receipt reports success");
  } else {
    console.log("\n4. Independent RPC verification skipped because RPC_URL is not set.");
  }

  console.log("\nDONE  KeeperHub execution reached a verified onchain transaction.");
} catch (error) {
  stop(error instanceof Error ? error.message : String(error));
}
