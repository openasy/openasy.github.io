# 0032. VPN servers at several locations, each with its own identity

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `vpn` adds servers under Servers with the address clients connect to and a one-time enrolment token; `vpn-server` trades the token for its own secret, kept in its state volume. Client configs list every server at its address. `VPN_SERVER_TOKEN` still works for servers set up before 0.6.0, until 0.7.0.
- **Priority:** High
- **Area:** Architecture

## Context

Up to 0.5.0, every `vpn-server` reported with one token shared with `vpn`, and named itself. Whoever held the token could claim any server name and fetch that server's private key. Client configs named a single host, `VPN_PUBLIC_HOST`, so a second server at another location never reached clients: several servers worked only as several ports on one host.

Teams want servers at more than one location: one per office or region, and a second one to fall back to when the first is down. They want to add and remove those servers from the same place they manage people and access, without SSH to each host.

## Decision

- An admin adds a server in `vpn` with a name and the address clients connect to. `vpn` returns a one-time enrolment token, valid for 7 days and shown once, as `infra-agent` does (ADR 0023).
- `vpn-server` starts with the token as `VPN_ENROLL_TOKEN` and trades it for its own secret. `vpn` keeps only the secret's hash. The server keeps the secret in its state directory, which is a volume.
- A secret speaks for its own server only: it reports for that server and fetches that server's config and key. An enrolled server cannot be reached with the shared token.
- Enrolling a server again, for a lost volume or a leaked secret, ends its secret at once and gives it a new certificate. Removing a server ends its secret and its sessions. In both cases its old certificate goes on the CRL.
- Every client config lists every server that has reported, each at its address, UDP before TCP. OpenVPN tries them in turn, so a client moves to the next server when one is down.
- All servers carry all devices, with the same VPN address per device. Each server NATs its clients, so the same address on two servers does not clash in the networks behind them. Assigning people to particular servers, or a pool per server, is not part of this decision.
- `vpn` still never connects to a server (ADR 0023): servers pull their config and push their state.
- Servers that report with `VPN_SERVER_TOKEN` keep working and are shown as legacy, so an upgrade breaks nothing. An admin enrols each of them; the shared token is removed in 0.7.0.

## Consequences

- A client config is fixed when it is made: a server added later reaches only devices added after it, and an address change reaches only new configs. The private key is not kept, so a config cannot be made again; the device is replaced instead. DNS names for locations avoid most of this.
- Client configs carry no CRL, so clients still trust a removed server's certificate until the CA is rotated. The CRL entry records the removal but does not protect clients. A leaked server key therefore needs a CA rotation, which is a separate decision.
- The server's state directory must be a volume. Without it the server needs a new enrolment token whenever its container is recreated.
- `GET /api/v1/servers` gains fields, and `version` and `lastSeen` are null until a server first reports.
