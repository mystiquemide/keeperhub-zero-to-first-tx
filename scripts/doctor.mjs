import {
  DEFAULT_BASE_URL,
  assertOrganizationKey,
  checkApiKey,
  listChains,
} from "../src/keeperhub.mjs";

const key = process.env.KEEPERHUB_API_KEY;
const baseUrl = process.env.KEEPERHUB_BASE_URL || DEFAULT_BASE_URL;

function pass(message) {
  console.log(`PASS  ${message}`);
}

function fail(message) {
  console.error(`FAIL  ${message}`);
}

try {
  assertOrganizationKey(key);
  pass("organization API key has the expected kh_ prefix");

  const auth = await checkApiKey({ key, baseUrl });
  if (!auth.response.ok) {
    fail(`API key validation returned HTTP ${auth.response.status}`);
    process.exit(1);
  }
  pass("API key is accepted by GET /api/keys");

  const chains = await listChains({ baseUrl });
  const enabledTestnets = chains.filter((chain) => chain.isEnabled && chain.isTestnet);
  if (!enabledTestnets.length) {
    fail("no enabled testnets were returned by GET /api/chains");
    process.exit(1);
  }

  pass(`${enabledTestnets.length} enabled testnet(s) available`);
  for (const chain of enabledTestnets) {
    console.log(`      ${chain.name} (${chain.chainId})${chain.explorerUrl ? ` - ${chain.explorerUrl}` : ""}`);
  }

  console.log("\nREADY  Auth and chain discovery are working.");
  console.log("Next: copy .env.example, choose an enabled testnet, then run npm run first-write.");
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
