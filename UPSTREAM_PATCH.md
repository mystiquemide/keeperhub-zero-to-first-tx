# KeeperHub documentation patch

These are intentionally small changes. They remove contradictions without duplicating the existing first-verified-transaction guide.

## Upstream status

Accepted and merged into KeeperHub's official `staging` branch on August 13, 2026:

**PR #2043 — `docs: make first-write onboarding safer and more consistent`**

https://github.com/KeeperHub/keeperhub/pull/2043

The merged upstream PR changes exactly three documentation files, with 10 additions and 7 deletions and no runtime or API changes.

## 1. `docs/index.md`

### Before

> All four provision a Turnkey wallet automatically on signup and include a monthly allowance of sponsored gas, so a first run does not require funding anything.

### Accepted fix

Clarify that eligible EVM transactions may use KeeperHub gas sponsorship, but sponsorship covers network fees only and remains conditional on network, sender routing, mempool path, and available credits. Any value or tokens being transferred must still be funded.

### Reason

Avoids implying that an unfunded wallet can transfer value or tokens, and points builders to the authoritative sponsorship conditions.

---

## 2. `docs/getting-started/api.md`

### Before

> Your organization's Turnkey wallet is provisioned on signup and gets a monthly allowance of sponsored gas on mainnet.

### Accepted fix

State that eligible transactions on supported EVM mainnets and testnets may use the organization's sponsored-gas allowance.

The existing explanation that sponsorship pays the network fee rather than the value moved remains in place.

### Reason

Aligns the getting-started page with `docs/wallet-management/gas.md`, which lists supported testnets and states that testnet sponsorship is not charged against the monthly cap.

---

## 3. `docs/getting-started/cli.md`

### Before

```bash
# Read a value
kh execute contract-call --chain 1 --contract 0x... --method balanceOf --args '["0x..."]'

# Write, and wait for the transaction
kh execute contract-call --chain 1 --contract 0x... --method transfer \
  --args '["0x...","1000"]' --wait
```

### Accepted fix

The beginner direct-call section explicitly recommends starting on a testnet and uses Ethereum Sepolia `11155111` for both examples:

```bash
# Read a value
kh execute contract-call --chain 11155111 --contract 0x... --method balanceOf --args '["0x..."]'

# Write, and wait for the transaction
kh execute contract-call --chain 11155111 --contract 0x... --method transfer \
  --args '["0x...","1000"]' --wait
```

It also points builders to `kh chain list` to choose another enabled testnet.

### Reason

Keeps the beginner CLI page consistent with the Direct Execution Safe First-Write Sequence and the verified-transaction guide, both of which tell builders to start on testnet.

---

## PR scope

- `docs/index.md`
- `docs/getting-started/api.md`
- `docs/getting-started/cli.md`

No product behavior, API behavior, dependencies, or runtime code are changed.
