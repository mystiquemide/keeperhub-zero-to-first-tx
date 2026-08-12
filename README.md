# KeeperHub Zero-to-First-Tx

A practical onboarding resource for new KeeperHub builders who want to go from a fresh account to a verified onchain transaction with the least ambiguity possible.

This project was created after building **Nulvek** for the KeeperHub Agents Onchain Hackathon. It focuses on the points that matter most in the first hour:

- which authentication path to use
- where the organization wallet fits
- how to fund a testnet wallet
- how to execute a real write
- how to distinguish an execution ID from a transaction hash
- how to verify the transaction independently onchain
- how retries and idempotency behave
- where to look when execution fails

## Why this exists

KeeperHub already has strong reference documentation for MCP, workflows, the CLI, Direct Execution, wallets, and run logs.

The onboarding gap is different: a new builder has to mentally join those pages into one causal path.

For a hackathon centered on **real execution**, the most useful first-run path is:

`account -> wallet -> gas -> auth -> execute -> execution ID -> transaction hash -> explorer -> retry model`

This repo turns that into one linear guide.

## Start here

1. [`ZERO_TO_FIRST_TX.md`](ZERO_TO_FIRST_TX.md)
2. [`FRICTION_REPORT.md`](FRICTION_REPORT.md)
3. [`UPSTREAM_PR_PROPOSAL.md`](UPSTREAM_PR_PROPOSAL.md)

## Scope

This is intentionally narrow.

It does not replace KeeperHub's official documentation and does not try to document every product surface. It is a first-transaction bridge that links a new builder to the deeper official references once the first write has succeeded.

## Official references

- https://docs.keeperhub.com/quickstart
- https://docs.keeperhub.com/getting-started/quickstart
- https://docs.keeperhub.com/api/authentication
- https://docs.keeperhub.com/api/direct-execution
- https://docs.keeperhub.com/api/executions
- https://docs.keeperhub.com/keeper-runs/status-logs
- https://docs.keeperhub.com/wallet-management/turnkey
- https://docs.keeperhub.com/cli/quickstart
- https://docs.keeperhub.com/cli/commands/kh_execute
- https://docs.keeperhub.com/ai-tools/mcp-server

## Bounty intent

This project targets the **Best Onboarding UX Improvement** bounty.

The contribution is a reproducible onboarding teardown plus a proposed documentation patch focused on reducing time-to-first verified transaction.
