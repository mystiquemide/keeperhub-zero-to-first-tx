# Proposed KeeperHub documentation patch

These are intentionally small changes. They remove contradictions without duplicating the existing first-verified-transaction guide.

## 1. `docs/index.md`

### Current

> All four provision a Turnkey wallet automatically on signup and include a monthly allowance of sponsored gas, so a first run does not require funding anything.

### Proposed

> All four provision a Turnkey wallet automatically on signup. Eligible EVM writes may use KeeperHub gas sponsorship, but sponsorship covers the network fee only, not the value or token being moved. See [Gas Management](/wallet-management/gas) for supported networks, sender-route requirements, and gas-credit conditions.

### Reason

Avoids implying that an unfunded wallet can transfer value or tokens, and points builders to the authoritative sponsorship conditions.

---

## 2. `docs/getting-started/api.md`

### Current

> Your organization's Turnkey wallet is provisioned on signup and gets a monthly allowance of sponsored gas on mainnet.

### Proposed

> Your organization's Turnkey wallet is provisioned on signup. Eligible EVM writes can use KeeperHub gas sponsorship on supported networks, including supported testnets, subject to sender-route and gas-credit conditions.

Keep the following existing paragraph explaining that sponsorship pays the network fee rather than the value moved.

### Reason

Aligns the getting-started page with `docs/wallet-management/gas.md`, which lists supported testnets and states that testnet sponsorship is not charged against the monthly cap.

---

## 3. `docs/getting-started/cli.md`

### Current

```bash
# Read a value
kh execute contract-call --chain 1 --contract 0x... --method balanceOf --args '["0x..."]'

# Write, and wait for the transaction
kh execute contract-call --chain 1 --contract 0x... --method transfer \
  --args '["0x...","1000"]' --wait
```

### Proposed

```bash
# Start with an enabled testnet. Use `kh chain list` to see the current catalog.
# Read a value on Ethereum Sepolia
kh execute contract-call --chain 11155111 --contract 0x... --method balanceOf --args '["0x..."]'

# Write on Ethereum Sepolia, and wait for the transaction
kh execute contract-call --chain 11155111 --contract 0x... --method transfer \
  --args '["0x...","1000"]' --wait
```

### Reason

Keeps the beginner CLI page consistent with the Direct Execution Safe First-Write Sequence and the verified-transaction guide, both of which tell builders to start on testnet.

---

## Suggested PR title

`docs: align first-run funding and testnet guidance`

## Suggested PR body

This patch tightens three onboarding details that can send a first-time builder down the wrong debugging path:

- clarifies that gas sponsorship covers fees, not transferred value/assets
- aligns API onboarding with the gas reference's supported-testnet sponsorship wording
- changes the beginner CLI write example from Ethereum mainnet to Sepolia

It deliberately does not add another first-transaction tutorial because KeeperHub already has `docs/guides/first-verified-transaction.md`. The goal is consistency across the entry points that lead builders into that guide.
