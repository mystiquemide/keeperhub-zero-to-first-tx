# KeeperHub onboarding consistency audit

This audit was produced from KeeperHub's `staging` documentation while turning the official first-write guidance into an executable starter.

The goal is not to rewrite KeeperHub's documentation. The docs already contain a strong [Zero to a Verified Onchain Transaction](https://github.com/KeeperHub/keeperhub/blob/staging/docs/guides/first-verified-transaction.md) guide and a built-in [`kh doctor`](https://github.com/KeeperHub/keeperhub/blob/staging/docs/cli/commands/kh_doctor.md).

The useful contribution was to remove a few remaining first-run contradictions and make the safe path executable.

## Upstream contribution

The three findings below were turned into a focused upstream documentation contribution that KeeperHub accepted and merged into `staging` on August 13, 2026:

**KeeperHub PR #2043 — `docs: make first-write onboarding safer and more consistent`**

https://github.com/KeeperHub/keeperhub/pull/2043

The merged PR changes only three docs files and does not alter KeeperHub runtime or API behavior.

## Finding 1: the overview overstated how little funding a first run needs

**Source:** `docs/index.md`

Before PR #2043, the Getting Started section said all four paths included sponsored gas, "so a first run does not require funding anything."

**Conflict:** `docs/wallet-management/gas.md` is more precise:

- sponsorship covers the transaction fee, not the value or token being moved
- sponsorship depends on network, sender route, public mempool, and available gas credits
- Safe-routed writes are not sponsored

The first-verified-transaction guide also explicitly requires testnet funds in whichever account actually pays or holds the transferred asset.

### Why this matters

A new builder could reasonably read the old overview as "my first transfer needs no balance" and then debug an insufficient-value or insufficient-token error as if KeeperHub failed.

### Accepted fix

KeeperHub now distinguishes conditional gas sponsorship from the asset/value being transferred and points builders to the authoritative gas guidance.

---

## Finding 2: API getting-started narrowed sponsorship to mainnet while the gas reference includes supported testnets

**Source:** `docs/getting-started/api.md`

Before PR #2043, the wallet section said the organization's Turnkey wallet "gets a monthly allowance of sponsored gas on mainnet."

**Conflict:** `docs/wallet-management/gas.md` says supported sponsorship networks include Ethereum, Base, Polygon and Arbitrum **plus their supported testnets**, and that testnet usage is not charged against the monthly cap.

### Why this matters

Hackathon builders are encouraged to start on testnet. The narrower wording could lead them to fund native gas unnecessarily or assume testnet execution cannot be sponsored.

### Accepted fix

KeeperHub now states that eligible transactions on supported EVM mainnets and testnets may use the organization's sponsored-gas allowance while preserving the explanation that sponsorship does not provide the value or token being moved.

---

## Finding 3: the beginner CLI page demonstrated a write on Ethereum mainnet

**Source:** `docs/getting-started/cli.md`

Before PR #2043, the direct contract-call section used `--chain 1` for both the read and write examples.

**Conflict:** the Direct Execution API's Safe First-Write Sequence and the first-verified-transaction guide both explicitly recommend starting with a testnet.

### Why this matters

The command contained placeholder addresses, so it was not immediately executable, but examples establish defaults. A beginner guide should not normalize mainnet as the first write target when the rest of the onboarding guidance says testnet first.

### Accepted fix

KeeperHub now uses Ethereum Sepolia `11155111` in the beginner examples, explicitly says to start on a testnet, and points builders to `kh chain list` for the current catalog.

---

# Executable improvement in this repo

The accompanying starter converts the official safety guidance into code:

1. validates a `kh_` organization key
2. reads the live public chain catalog
3. refuses disabled chains
4. refuses mainnet unless `ALLOW_MAINNET=1` is explicitly set
5. simulates before broadcast
6. defaults to simulation-only mode
7. derives a stable idempotency key from a caller-supplied task identity and normalized transfer effect
8. polls execution status rather than blindly retrying
9. treats `unconfirmed` as unknown/non-terminal
10. checks KeeperHub receipt evidence
11. optionally re-fetches the transaction receipt from an independent RPC

This is intentionally a starter, not a second SDK. It uses only Node.js built-ins and the documented KeeperHub HTTP API.
