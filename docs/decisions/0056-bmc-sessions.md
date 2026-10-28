# 0056. Infrastructure: one Redfish session per BMC collection, and BMCs that break HTTP read anyway

- **Decision:** Proposed
- **Implementation:** Implemented
- **Where:** `infra-agent` signs in to each BMC once per collection and out at the end (`agent/redfish.ts`); `infra`'s end-to-end BMC takes sessions like iDRAC and iLO (`e2e/bmc.ts`).
- **Priority:** High
- **Area:** Architecture

## Context

ADR 0055 had the agent send Basic auth on each request, so it left no session behind. On the first install with real hardware, 22 Dell iDRACs (7, 8 and 9), most collections ended as a timeout or as unreachable, while the same iDRACs opened at once in a browser:

- **An iDRAC checks Basic auth again on every request.** That takes 4 to 7 seconds on iDRAC 7 and 8; a collection is 30 to 60 requests and more with the event logs, and ran past its 4 minutes. With a session's token the same request takes about a second, which is what a browser does.
- **iDRAC 8's web server (Appweb 4.5) writes past the end of an answer.** A few bytes follow the length it gave. The next answer on that kept-alive connection starts with them, and Node's HTTP parser refuses it; Node also reports it for the answer that was already whole. curl, which does not keep the connection, never sees it.
- **BMCs close kept-alive connections without notice.** The next request on one fails as a reset.

## Decision

- **One session per collection.** After the service root, which needs no account, the agent signs in with a POST of the account and password to the BMC's session collection: the one the service root links as `Links.Sessions` when it is `/redfish/v1/SessionService/Sessions` or `/redfish/v1/Sessions` (iDRAC 8), and the first otherwise. Every read then carries the token (`X-Auth-Token`). At the end, also after a failure, it sends a DELETE for the session that sign-in made, at the address the BMC gave (`Location`) when that is one session under the same collection. A BMC that gives no token is read with Basic auth, as before; a 401 to the sign-in is a refused account.
- **Still read-only.** Besides GET, the agent's Redfish client sends that one POST, to a fixed path, and that one DELETE, of its own session. Neither path comes from Infrastructure or from a link the agent follows, so a compromised Infrastructure still cannot power a server off, change a setting or start an update. The token stays in the agent's memory for the collection.
- **An answer is whole at its length.** The client takes an answer when it has the bytes `Content-Length` gave, and ignores what the connection says after that. When an answer on a kept-alive connection does not start like HTTP, the request is sent once more on a connection of its own, and the rest of that collection uses one connection per request. A GET or a DELETE that meets a reset connection is sent once more too. A sign-in always goes on a new connection and is never sent twice, so it cannot leave a second session behind.
- **8 minutes per collection.** The limit is below the 10 minutes Infrastructure leases a job for, so a slow BMC ends as a timeout and not as a lost job. The 600 requests stay.

## Consequences

- On the install above, the iDRACs that answer Redfish were read in 25 to 70 seconds each instead of timing out; all the iDRAC 8s read this way took the session, and iDRAC 7 and 8 firmware without Redfish (before 2.40) still says `not-redfish`.
- A collection holds one of the BMC's few sessions (iDRAC allows a handful for Redfish) for about a minute. A DELETE that does not arrive leaves the session to expire on its own (30 minutes by default on iDRAC).
- The sign-in sends the password in a JSON body instead of a header, on the same pinned connection (ADR 0055).
- infra-agent and infra are released together (ADR 0019); this changes no API between them.
