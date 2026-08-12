import test from "node:test";
import assert from "node:assert/strict";

import {
  canonicalizeAmount,
  listChains,
  pollDirectExecution,
  stableTransferIdempotencyKey,
  transferRequestBody,
  verifyTransactionReceipt,
} from "../src/keeperhub.mjs";

test("canonicalizeAmount normalizes equivalent decimal strings", () => {
  assert.equal(canonicalizeAmount("0.1000"), "0.1");
  assert.equal(canonicalizeAmount("01.500"), "1.5");
  assert.equal(canonicalizeAmount(".5"), "0.5");
  assert.equal(canonicalizeAmount("000"), "0");
});

test("canonicalizeAmount rejects ambiguous numeric forms", () => {
  assert.throws(() => canonicalizeAmount("1e-3"), /exponent/);
  assert.throws(() => canonicalizeAmount("-1"), /unsigned/);
});

test("stable transfer key survives cosmetic input differences", () => {
  const a = stableTransferIdempotencyKey({
    taskId: " invoice-7 ",
    chainId: "84532",
    recipientAddress: "0xAbCd",
    amount: "0.1000",
    tokenAddress: "0xDeF0",
  });
  const b = stableTransferIdempotencyKey({
    taskId: "invoice-7",
    chainId: 84532,
    recipientAddress: "0xabcd",
    amount: "0.1",
    tokenAddress: "0xdef0",
  });
  assert.equal(a, b);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test("different task ids produce different execution identities", () => {
  const base = {
    chainId: 84532,
    recipientAddress: "0xabcd",
    amount: "1",
    tokenAddress: "",
  };
  const a = stableTransferIdempotencyKey({ ...base, taskId: "pay-1" });
  const b = stableTransferIdempotencyKey({ ...base, taskId: "pay-2" });
  assert.notEqual(a, b);
});

test("transferRequestBody omits an empty token address", () => {
  assert.deepEqual(
    transferRequestBody({
      chainId: "84532",
      recipientAddress: " 0xabc ",
      amount: "01.00",
      tokenAddress: "",
    }),
    { chainId: 84532, recipientAddress: "0xabc", amount: "1" },
  );
});

test("listChains accepts the documented bare-array response", async () => {
  const fakeFetch = async () =>
    new Response(JSON.stringify([{ chainId: 84532, isEnabled: true, isTestnet: true }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const chains = await listChains({ baseUrl: "https://example.test", fetchImpl: fakeFetch });
  assert.equal(chains[0].chainId, 84532);
});

test("poller treats unconfirmed as non-terminal and keeps polling", async () => {
  const responses = [
    new Response(JSON.stringify({ status: "unconfirmed" }), {
      status: 200,
      headers: { "x-poll-interval-hint": "0" },
    }),
    new Response(JSON.stringify({ status: "completed" }), {
      status: 200,
      headers: { "x-poll-interval-hint": "0" },
    }),
  ];
  let calls = 0;
  const fakeFetch = async () => responses[calls++];
  const sleeps = [];

  const result = await pollDirectExecution({
    key: "kh_test",
    executionId: "exec_1",
    baseUrl: "https://example.test",
    fetchImpl: fakeFetch,
    sleep: async (ms) => sleeps.push(ms),
    timeoutMs: 1000,
  });

  assert.equal(result.body.status, "completed");
  assert.equal(calls, 2);
  assert.deepEqual(sleeps, [1000]);
});

test("independent RPC verification reports successful receipt", async () => {
  const fakeFetch = async () =>
    new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { status: "0x1" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const result = await verifyTransactionReceipt({
    rpcUrl: "https://rpc.example",
    transactionHash: "0x1234",
    fetchImpl: fakeFetch,
  });
  assert.equal(result.found, true);
  assert.equal(result.success, true);
});
