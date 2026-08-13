# KeeperHub Safe First Write

A dependency-free starter that turns KeeperHub's first-write safety guidance into an executable path, plus an evidence-based audit of three remaining onboarding inconsistencies.

Built after shipping **Nulvek** with KeeperHub for the Agents Onchain Hackathon.

## Upstream contribution

The documentation fixes from this audit were accepted and merged into KeeperHub's official `staging` branch on August 13, 2026:

**KeeperHub PR #2043 — `docs: make first-write onboarding safer and more consistent`**

https://github.com/KeeperHub/keeperhub/pull/2043

The merged PR is intentionally small: three documentation files, 10 additions and 7 deletions, with no runtime or API changes.

## Why this contribution exists

KeeperHub already has good onboarding material, including:

- `docs/guides/first-verified-transaction.md`
- the built-in `kh doctor` command
- dedicated Browser, Agent/MCP, API, and CLI getting-started paths

So this repo deliberately does **not** add another generic tutorial or another doctor command.

Instead it contributes two things that are still useful:

1. **An executable safe-first-write starter** that applies the official guidance by default.
2. **A reproducible docs consistency audit** whose focused fixes were accepted upstream by KeeperHub.

## What the starter enforces

The starter:

- validates that the credential is a `kh_` organization key
- checks the key against `GET /api/keys`
- reads the live public `GET /api/chains` catalog
- refuses disabled chains
- refuses mainnet unless `ALLOW_MAINNET=1` is explicitly set
- simulates before broadcast
- defaults to simulation-only mode
- requires a stable `TASK_ID` before a real write
- derives a deterministic idempotency key from the task and normalized transfer effect
- polls the returned KeeperHub execution instead of blindly retrying
- treats `unconfirmed` as unknown/non-terminal
- checks KeeperHub receipt evidence before calling the write successful
- can independently re-fetch the transaction receipt through your own EVM RPC
- never prints the API key

There are no runtime dependencies beyond Node.js 20+.

## Quick start

Clone and test:

```bash
git clone https://github.com/mystiquemide/keeperhub-zero-to-first-tx.git
cd keeperhub-zero-to-first-tx
npm test
```

Set your KeeperHub organization key and run the read-only onboarding check:

```bash
export KEEPERHUB_API_KEY=kh_...
npm run doctor
```

Configure a testnet transfer. Base Sepolia is the default chain, but the script first checks the live KeeperHub chain catalog.

```bash
export CHAIN_ID=84532
export RECIPIENT_ADDRESS=0x...
export AMOUNT=0.001

# Optional for ERC-20 transfers. Omit for a native-token transfer.
export TOKEN_ADDRESS=0x...
```

Run the first-write flow:

```bash
npm run first-write
```

**Nothing is broadcast by default.** The script simulates the exact request and stops.

When you intentionally want to execute the same request:

```bash
export EXECUTE=1
export TASK_ID=my-first-transfer-001
npm run first-write
```

For an independent EVM receipt check, also set:

```bash
export RPC_URL=https://your-rpc.example
```

Mainnet remains blocked unless you deliberately set `ALLOW_MAINNET=1`.

See [`.env.example`](.env.example) for every option.

## The onboarding audit

[`ONBOARDING_AUDIT.md`](ONBOARDING_AUDIT.md) records the three inconsistencies identified in KeeperHub's `staging` documentation before PR #2043 was merged:

1. **Funding expectation:** the overview said a first run did not require funding anything, while the gas reference correctly said sponsorship covers fees only, not the transferred asset/value, and is conditional on the execution route.
2. **Testnet sponsorship wording:** API onboarding described the allowance as mainnet sponsored gas, while the gas reference listed supported testnets too and said testnet usage is not charged against the monthly cap.
3. **Beginner CLI default:** the CLI getting-started page demonstrated its first write with Ethereum mainnet chain `1`, while KeeperHub's Safe First-Write Sequence and verified-transaction guide explicitly recommended starting on testnet.

[`UPSTREAM_PATCH.md`](UPSTREAM_PATCH.md) records the accepted fixes and links the merged upstream PR.

## Project structure

```text
scripts/doctor.mjs       Read-only auth + live chain-catalog preflight
scripts/first-write.mjs  Simulate-first testnet transfer flow
src/keeperhub.mjs        KeeperHub HTTP, idempotency, polling, RPC helpers
test/                    Dependency-free Node tests
ONBOARDING_AUDIT.md      Reproducible onboarding findings
UPSTREAM_PATCH.md        Accepted upstream documentation patch
```

## Official KeeperHub sources used

- https://github.com/KeeperHub/keeperhub/blob/staging/docs/index.md
- https://github.com/KeeperHub/keeperhub/blob/staging/docs/getting-started/api.md
- https://github.com/KeeperHub/keeperhub/blob/staging/docs/getting-started/cli.md
- https://github.com/KeeperHub/keeperhub/blob/staging/docs/getting-started/agent.md
- https://github.com/KeeperHub/keeperhub/blob/staging/docs/api/direct-execution.md
- https://github.com/KeeperHub/keeperhub/blob/staging/docs/api/chains.md
- https://github.com/KeeperHub/keeperhub/blob/staging/docs/guides/first-verified-transaction.md
- https://github.com/KeeperHub/keeperhub/blob/staging/docs/wallet-management/gas.md
- https://github.com/KeeperHub/keeperhub/blob/staging/docs/cli/commands/kh_doctor.md

## Bounty fit

This targets the **Best Onboarding UX Improvement** bounty as a **starter template + reproducible teardown + merged upstream docs contribution**.

The goal is simple: help a new builder reach a real KeeperHub execution with safer defaults, while removing first-run wording that can send them down the wrong debugging path.
