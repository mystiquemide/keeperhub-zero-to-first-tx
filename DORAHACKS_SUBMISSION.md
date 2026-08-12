# DoraHacks bounty submission draft

## BUIDL name

KeeperHub Safe First Write

## Vision

A safe-by-default starter that gets new KeeperHub builders from a valid organization key to a simulated, idempotent, independently verifiable onchain write without making them reconstruct the reliability model from multiple docs pages.

## What it is

This is not another agent app and it does not duplicate KeeperHub's existing first-transaction tutorial or `kh doctor` command.

It is a small executable starter plus an onboarding consistency audit created from hands-on KeeperHub use while building Nulvek.

The starter encodes the safety path directly:

`validate auth -> read live chains -> require testnet -> simulate -> explicit execute gate -> stable idempotency identity -> poll execution -> verify KeeperHub receipt -> optional independent RPC check`

## Onboarding improvement

The project addresses two kinds of first-run friction.

### 1. Make the safe path executable

A new builder can run a read-only doctor, configure one transfer, simulate it, and only broadcast after explicitly setting `EXECUTE=1` and a stable `TASK_ID`.

The starter refuses mainnet by default, never prints the API key, does not blindly retry an `unconfirmed` execution, and can independently verify the resulting EVM receipt.

### 2. Remove contradictory expectations in the current docs

The audit identifies three reproducible inconsistencies in KeeperHub's current `staging` documentation:

- the overview implies a first run needs no funding, while sponsorship covers gas only and remains conditional
- API onboarding describes sponsored gas as mainnet-only even though the gas reference includes supported testnets
- the beginner CLI page uses Ethereum mainnet chain `1` for its write example while the official safe-first-write guidance says to start on testnet

`UPSTREAM_PATCH.md` contains minimal fixes for those three points.

## Why it helps

KeeperHub already has deep documentation. The remaining onboarding cost is often not missing reference material, but converting several correct concepts into a safe first execution and avoiding contradictory expectations between entry pages.

This project keeps the official docs as the source of truth and turns their execution, simulation, idempotency, receipt, and chain-verification guidance into defaults a new builder can run.

## Contribution type

Starter template + onboarding teardown + proposed documentation patch.

## Repository

https://github.com/mystiquemide/keeperhub-zero-to-first-tx
