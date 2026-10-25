import type { ProductStory } from "./types";

export const runtime: ProductStory = {
  problem: {
    title: "What processes actually do on your hosts and pods, as it happens",
    headline: "Scanners do not see an attacker who is already in",
    text: "Scanners say what could be exploited; they do not see an attacker who is already in: a shell started by a web server, a binary written to /tmp and run, a container reading /etc/shadow, an unexpected connection to the internet. Runtime will watch processes, network connections and file changes on hosts and Kubernetes pods with eBPF, and raise a detection when they break the rules.",
    example:
      "A container of the shop's API suddenly starts /bin/sh, which it never does. Runtime raises a detection with the process tree: the shell was started by the Node.js process, right after a request to an upload endpoint.",
  },
  who: ["The security team, who respond to detections", "Platform teams, who run the hosts and clusters"],
  glance: [
    {
      label: "Watches",
      value: "Processes, network, files",
    },
    {
      label: "With",
      value: "eBPF sensors",
    },
    {
      label: "On",
      value: "Hosts and Kubernetes pods",
    },
    {
      label: "Raises",
      value: "Detections with a process tree",
    },
  ],
  flow: [
    {
      label: "eBPF sensors",
      detail: "On each host or node, watching process starts, connections and file changes.",
    },
    {
      label: "Rules",
      detail: "Detections for what should not happen, such as a shell in a container.",
    },
    {
      label: "Detections",
      detail: "With the process tree, the container and the host.",
    },
    {
      label: "Response",
      detail: "Investigated here, sent on as signals or incidents.",
    },
  ],
  checks: [
    {
      title: "What it watches",
      items: ["Process starts and their parents", "Network connections", "File integrity of sensitive paths", "Container and pod context"],
    },
  ],
  decides: [
    {
      label: "Detection",
      text: "A detection is a rule that matched an event, with its process tree.",
    },
    {
      label: "Policies",
      text: "Policies decide what is normal for a workload.",
    },
  ],
  inputs: [
    {
      name: "eBPF",
      url: "https://ebpf.io/",
      how: "A sensor on Linux hosts and Kubernetes nodes.",
    },
  ],
  screens: [
    {
      page: "detections",
      title: "Detections",
      shows: "Every detection with its process tree, container and host.",
      story: "detections",
    },
    {
      page: "processes",
      title: "Processes",
      shows: "What ran where, and what started it.",
      story: "processes",
    },
    {
      page: "file-integrity",
      title: "File integrity",
      shows: "Changes to the files that should never change.",
      story: "file-integrity",
    },
  ],
  worksWith: [
    {
      id: "siem",
      how: "Detections become signals among the other security events.",
    },
    {
      id: "incidents",
      how: "A severe detection opens an incident.",
    },
    {
      id: "infrastructure",
      how: "Infrastructure lists what should run on each host.",
    },
  ],
  limits: ["Unlike the other products, it needs a sensor on each host or node: eBPF cannot be read from outside.", "It needs a recent Linux kernel."],
};
