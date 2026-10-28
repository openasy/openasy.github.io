# 0061. Access: requests and approvals, short-lived SSH certificates, and an audit log nobody changes

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `access` takes requests for SSH access to a server with a reason and a duration, has someone other than the requester approve them, and signs OpenSSH certificates for the requester's own key that work on that server only, as that account, until the access ends; servers trust its CA with `TrustedUserCAKeys` and fetch its revocation list every minute (`ghcr.io/openasy/access`). Every request, approval, certificate and refused attempt is in an append-only audit log. The session proxy, which ends open sessions and records them, RDP and database access are planned.
- **Priority:** High
- **Area:** Architecture

## Context

Standing access to production is the risk: every engineer with a key in `authorized_keys` is a way in for anyone who steals their laptop, and the key still works years after the reason for it is gone. Auditors ask who could reach a server on a given day and why, and a list of keys cannot answer. OpenSSH has had user certificates since 2010: a server that trusts a certificate authority accepts any certificate it signed for an account the server allows, until the certificate expires. What teams lack is the part around the CA: someone asks, someone else decides, and the certificate is made for that one server and that hour only.

## Decision

- **A request is for one server, one account and a duration, with a reason.** A server's policy, kept by admins, names the accounts one may ask for, the longest access (an hour unless set, at most a day) and whether one or two people must approve. One request per person, server and account may wait or be open at a time; one nobody approves within a day is cancelled.
- **Someone else approves.** Approving and denying need the editor role and a person who is not the requester, compared by account and by email; a try at one's own is refused whatever the role, and recorded. Two approvals mean two different people. The access starts at the last approval and lasts as long as asked for; the policy is checked again at that moment.
- **A person acts, with a second factor.** Asking, approving and getting a certificate need a session signed in with an authenticator app or a passkey, or through an identity provider, which asks for its own (ADR 0002). API tokens can read, keep servers and revoke, but never ask, approve or get a certificate.
- **Certificates for people's own keys.** The requester sends a public key and gets an OpenSSH user certificate; the private key never leaves their computer. Its only principal is `account@server`, and each server's `AuthorizedPrincipalsFile` lists only its own, so a certificate for one server works nowhere else. It is valid from a minute before it is issued until the access ends, allows a terminal and no forwarding, and its key ID names the person and the request, so the server's own log says who logged in. Certificates and revocation lists are written by Access itself from OpenSSH's protocol documents, so the image needs no ssh tools; the tests read them back with `ssh-keygen` and log in to a real sshd.
- **One CA per install, sealed.** The CA is an Ed25519 key made on first start, sealed with its own data key under the install's key (ADR 0021). Access does not start without that key, or with another one, rather than make a CA no server trusts.
- **Ending early revokes.** The requester ends their own access; an editor revokes anyone's. The certificates of an access ended early are on an OpenSSH key revocation list, by serial, until they would have expired. Servers fetch it every minute for `RevokedKeys`; it holds serials only, so it needs no token, nor does the CA's public key.
- **An audit log nobody changes** (ADR 0013). Every request, decision, start and end, certificate, change to a server, sign-in and refused attempt is a row the database itself refuses to change or delete. It is written to stdout as it happens, for a SIEM, and exported as CSV with cells a spreadsheet will not run as formulas.
- **Setup is commands, not an agent.** Access never connects to a server. For each server it gives the commands to run once as root: the CA key, a principals file per account, the revocation list and its cron job, and three lines of sshd configuration.

## Consequences

- Access ends new logins at its time, and a revoked certificate within a minute, but a session already open stays open until it is closed. Ending it at the time, and recording sessions for review, need a proxy that sessions go through; it is planned with RDP and PostgreSQL and MySQL access.
- Keys in `authorized_keys` keep working beside certificates. Access replaces standing keys only where they are removed, and an install keeps one way in that does not depend on Access, such as a console.
- sshd refuses every key when the revocation list is missing, so the setup fetches it before sshd is told about it.
- Losing the install's key means a new CA, and every server trusting it again; the key goes with the backups.
- Approvers per server, groups from Identity, approving from Slack, automatic approval of low-risk access, port forwarding and CA rotation are not built yet.
