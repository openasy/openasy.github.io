import type { ProductStory } from "./types";

export const supplyChain: ProductStory = {
  problem: {
    title: "Only images you built, signed and can account for get to run",
    headline: "An image you cannot account for should not run",
    text: "A container image can come from anywhere: a laptop, a tampered registry, a pipeline someone changed. Once it runs, it has the access of the service. Knowing that an image was built by your pipeline, from which source, with which packages and licences, and refusing the ones you cannot account for, is the defence. Supply Chain keeps what CI knows about every image and answers, against one policy, whether it may run.",
    example:
      "The policy requires a signature from the company's build pipeline and denies AGPL licences. A developer pushes an image built on a laptop. When the cluster's admission webhook asks, the answer is denied: no verified signature. An image of the same service from the pipeline is allowed. An exception for a vendor image waives the signature for 90 days, with a reason, and the answer still lists it.",
  },
  who: [
    "Platform teams, who decide what may run in production",
    "The security team, who set the policy and its exceptions",
    "Auditors, who ask what is running and where it came from",
  ],
  glance: [
    {
      label: "Judges",
      value: "Every container image",
    },
    {
      label: "Evidence",
      value: "SBOM, signature, provenance",
    },
    {
      label: "Answers",
      value: "Admission webhooks, pipelines",
    },
    {
      label: "Unknown images",
      value: "Denied",
    },
  ],
  flow: [
    {
      label: "Your CI builds",
      detail: "Syft makes the image's SBOM; cosign verifies its signature; the build records its provenance.",
    },
    {
      label: "Evidence is sent",
      detail: "CI posts the SBOM, the signature check and a provenance summary for the image's digest.",
    },
    {
      label: "Judged by the policy",
      detail: "Every image is checked against one policy: signature, SBOM, provenance level and licences, minus exceptions.",
    },
    {
      label: "Allowed or denied",
      detail: "A Kubernetes admission webhook or a pipeline asks; the answer says allowed or denied, with the reasons.",
    },
  ],
  checks: [
    {
      title: "Signature",
      items: ["A verified signature is required", "Optionally from signers whose identity matches your patterns, from an issuer you name"],
    },
    {
      title: "SBOM and provenance",
      items: ["An SBOM is required", "Provenance of at least the SLSA build level you choose"],
    },
    {
      title: "Licences",
      items: [
        "An allow list and a deny list of SPDX licence ids",
        "OR expressions pass when one alternative does; AND needs every part",
        "With an allow list, a package whose licence nobody named is denied",
      ],
    },
  ],
  decides: [
    {
      label: "Policy",
      text: "One policy for the install, applied to every image at once.",
    },
    {
      label: "Unknown images",
      text: "An image nobody reported on is denied.",
    },
    {
      label: "Exceptions",
      text: "An exception waives one rule or all, for an image name or one digest, with a reason and an end within a year; the answer still lists what was waived.",
    },
  ],
  inputs: [
    {
      name: "Syft",
      url: "https://github.com/anchore/syft",
      how: "The image's SBOM, in CycloneDX or SPDX.",
    },
    {
      name: "cosign",
      url: "https://github.com/sigstore/cosign",
      how: "The result of CI's signature check, with the signer and issuer.",
    },
    {
      name: "SLSA provenance",
      url: "https://slsa.dev/",
      how: "A summary of the build's provenance and its level.",
    },
  ],
  screens: [
    {
      page: "overview",
      title: "Overview",
      shows: "Allowed and denied images, the reasons for denial and the packages and licences that come up most.",
    },
    {
      page: "images",
      title: "Images",
      shows: "Each image digest, its evidence and whether the policy allows it.",
      story: "images",
    },
    {
      page: "packages",
      title: "Packages",
      shows: "Every package in the SBOMs, with its licence and the images it is in.",
      story: "sboms",
    },
    {
      page: "policy",
      title: "Policy",
      shows: "The one policy: signature, SBOM, provenance and licence rules.",
      story: "policies",
    },
  ],
  worksWith: [
    {
      id: "vulnerabilities",
      how: "Vulnerabilities matches the same images' packages against known vulnerabilities.",
    },
    {
      id: "audit",
      how: "Audit checks the dependencies in the code before an image is built.",
    },
    {
      id: "identity",
      how: "People sign in with Identity or any OpenID Connect provider.",
    },
  ],
  limits: [
    "It records what CI says: it does not verify signatures or provenance itself yet. Checking them against the transparency log is planned.",
    "It builds and signs nothing.",
    "Admission control inside the cluster is your webhook asking it; enforcement in the cluster itself is planned.",
  ],
};
