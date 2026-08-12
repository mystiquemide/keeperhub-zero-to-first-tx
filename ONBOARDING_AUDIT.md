# KeeperHub onboarding consistency audit

This audit was produced from the current `staging` branch of `KeeperHub/keeperhub` while turning the official first-write guidance into an executable starter.

The goal is not to rewrite KeeperHub's documentation. The current docs already contain a strong [Zero to a Verified Onchain Transaction](https://github.com/KeeperHub/keeperhub/blob/staging/docs/guides/first-verified-transaction.md) guide and a built-in [`kh doctor`](https://github.com/KeeperHub/keeperhub/blob/staging/docs/cli/commands/kh_doctor.md).

The useful contribution is to remove a few remaining first-run contradictions and make the safe path executable.

## Upstream contribution

The three findings below have been turned into a focused upstream documentation contribution:

**KeeperHub PR #2043 — `docs: make first-write onboarding safer and more consistent`**

https://github.com/KeeperHub/keeperhub/pull/2043

The PR changes only three docs files and does not alter KeeperHub runtime or API behavior.

## Finding 1: the overview overstates how little funding a first run needs

**Source:** `docs/index.md`

The Getting Started section currently says all four paths include sponsored gas, "so a first run does not require funding anything."

**Conflict:** `docs/wallet-management/gas.md` is more precise:

- sponsorship covers the transaction fee, not the value or token being moved
- sponsorship depends on network, sender route, public mempool, and available gas credits
- Safe-routed writes are not sponsored

The first-verified-transaction guide also explicitly requires testnet funds in whichever account actually pays or holds the transferred asset.

### Why this matters

A new builder can reasonably read the overview as "my first transfer needs no balance" and then debug an insufficient-value or insufficient-token error as if KeeperHub failed.

### Submitted fix

Replace the blanket statement with a short distinction explaining that gas sponsorship is conditional, covers network fees only, and does not provide the asset/value being transferred.

---

## Finding 2: API getting-started narrows sponsorship to mainnet while the gas reference includes supported testnets

**Source:** `docs/getting-started/api.md`

The wallet section says the organization's Turnkey wallet "gets a monthly allowance of sponsored gas on mainnet."

**Conflict:** `docs/wallet-management/gas.md` says supported sponsorship networks include Ethereum, Base, Polygon and Arbitrum **plus their supported testnets**, and that testnet usage is not charged against the monthly cap.

### Why this matters

Hackathon builders are encouraged to start on testnet. The narrower wording can lead them to fund native gas unnecessarily or assume testnet execution cannot be sponsored.

### Submitted fix

Use wording that covers eligible transactions on supported EVM mainnets and testnets while preserving the existing explanation that sponsorship does not provide the value or token being moved.

---

## Finding 3: the beginner CLI page demonstrates a write on Ethereum mainnet

**Source:** `docs/getting-started/cli.md`

The direct contract-call section currently uses `--chain 1` for both the read and the write example.

**Conflict:** the Direct Execution API's Safe First-Write Sequence and the first-verified-transaction guide both explicitly recommend starting with a testnet.

### Why this matters

The command contains placeholder addresses, so it is not immediately executable, but examples establish defaults. A beginner guide should not normalize mainnet as the first write target when the rest of the onboarding guidance says testnet first.

### Submitted fix

The upstream PR uses Ethereum Sepolia `11155111` in the beginner examples, explicitly says to start on a testnet, and points builders to `kh chain list` for the current catalog.

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
