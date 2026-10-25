import type { ProductStory } from "./types";

export const profiling: ProductStory = {
  problem: {
    title: "Which lines of code use the CPU and memory, all the time, in production",
    headline: "A trace says which service, not which function",
    text: "A trace says a service is slow; it does not say which function. Profilers do, but they are usually run by hand on a laptop, far from production's real load. Continuous profiling with eBPF samples every process on a host with almost no overhead and no code changes. Profiling will keep those samples as flame graphs, per service and over time, and compare two periods to show what got slower.",
    example:
      "After a release, an API uses 40% more CPU. Comparing this week's flame graph with last week's shows a JSON serializer called twice per request, added in the new version.",
  },
  who: ["Developers, who make code faster", "SREs, who chase CPU and memory costs"],
  glance: [
    {
      label: "Samples",
      value: "Every process, with eBPF",
    },
    {
      label: "Shows",
      value: "Flame graphs",
    },
    {
      label: "Compares",
      value: "Two periods",
    },
    {
      label: "Code changes",
      value: "None",
    },
  ],
  flow: [
    {
      label: "eBPF samples",
      detail: "An agent samples stacks of every process on a host or node, without code changes.",
    },
    {
      label: "Kept per service",
      detail: "Samples stored per service and over time.",
    },
    {
      label: "Flame graphs",
      detail: "Where CPU and memory go, down to the function.",
    },
    {
      label: "Compared",
      detail: "Two periods side by side, to see what changed.",
    },
  ],
  checks: [
    {
      title: "Profiles",
      items: ["CPU time per function", "Memory allocations", "Per service, host and version", "A diff between two periods"],
    },
  ],
  decides: [
    {
      label: "Profile",
      text: "A profile is the samples of one service in a period.",
    },
    {
      label: "Comparisons",
      text: "Comparisons show the functions whose share grew or shrank.",
    },
  ],
  inputs: [
    {
      name: "eBPF",
      url: "https://ebpf.io/",
      how: "Sampling by an agent on Linux hosts and Kubernetes nodes.",
    },
  ],
  screens: [
    {
      page: "profiles",
      title: "Profiles",
      shows: "Every service and its CPU and memory profile.",
      story: "profiles",
    },
    {
      page: "flame-graph",
      title: "Flame graph",
      shows: "Where time goes, function by function.",
      story: "flame-graph",
    },
    {
      page: "compare",
      title: "Compare",
      shows: "Two periods side by side.",
      story: "compare",
    },
  ],
  worksWith: [
    {
      id: "traces",
      how: "From a slow span to the profile of that moment.",
    },
    {
      id: "metrics",
      how: "From a CPU spike in a graph to what used it.",
    },
  ],
  limits: ["eBPF needs a recent Linux kernel.", "It shows where time goes, not why a request was slow end to end; that is Traces."],
};
