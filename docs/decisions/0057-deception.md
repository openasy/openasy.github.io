# 0057. Deception: canaries with a token each, found by URL, DNS or CloudTrail, and a trigger a person decides on

- **Decision:** Proposed
- **Implementation:** In progress
- **Where:** `deception` makes canaries from templates, answers canary URLs and a DNS zone, reads CloudTrail events for AWS key canaries, and keeps triggers that open incidents (`ghcr.io/openasy/deception`). Decoy hosts and decoy accounts are planned.
- **Priority:** Medium
- **Area:** Architecture

## Context

Most alerts need a threshold and a person to sort the noise from the rest. A canary needs neither: a fake key, a kubeconfig or a host name that nobody has a reason to use. Its use is an alert with no false positives except tests, and it often comes earlier than anything else, because intruders look for credentials first.

A canary only works if it looks real, if each copy can be told apart, and if calling home works from wherever the attacker is: through a proxy, a firewall that lets only DNS out, or from the attacker's own machine with a stolen key.

## Decision

- **Three ways to call home.** A URL (`/c/<token>`, with anything after it, so a kubeconfig's cluster can be one), a DNS name in a zone delegated to deception, and an AWS access key whose use CloudTrail records. Templates turn each into bait: a link, a kubeconfig, a `.env`, an HTML page, a host name, an SSH config and an AWS credentials file.
- **A token per canary.** Each canary gets its own random token, so a trigger names the copy that was used and where it was planted. Random values in a bait lead nowhere.
- **Nothing tells a caller it found a canary.** Every canary path answers the same transparent image, known or not, and canary URLs stay out of the request log. Canary URLs can be served under another name or on a port of their own, so the bait does not name the product.
- **The DNS server answers only its zone** and refuses the rest. The source of a DNS trigger is the last resolver, and the trigger says so.
- **No cloud credentials.** An AWS key canary is a key of an IAM user with a deny-all policy that the team creates. deception finds its use in CloudTrail events a pipeline sends, in the shapes CloudTrail and EventBridge produce, keeping each event once by its ID. The key's secret is sealed with the install's key (ADR 0021), so the bait can be shown again.
- **A trigger is the use of one canary from one address**, with uses within 15 minutes as its hits. There is no threshold. A person decides whether it was a breach or a test; a test needs a reason.
- **Each trigger opens an incident** in Incidents when linked (ADR 0041), critical by default, with a link back; a test is noted on it.

## Consequences

- URL and AWS key canaries work without anything outside the product but a pipeline for CloudTrail. DNS canaries need a delegated zone and UDP 53 published.
- An attacker who uses a stolen AWS key is seen as fast as the CloudTrail pipeline runs, minutes rather than seconds.
- A canary tells that someone is inside, not how they got in. Decoy hosts, which show what an intruder tries on the network, follow as their own decision.
