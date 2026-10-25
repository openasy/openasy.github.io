import type { ProductStory } from "./types";

export const traces: ProductStory = {
  problem: {
    title: "Which service makes a request slow, followed across every hop",
    headline: "Every dashboard looks fine while the request is slow",
    text: "One click in an application can touch a dozen services, queues and databases. When it is slow, every team's dashboard looks fine on its own. Distributed tracing follows the request through each hop and shows where the time went. Traces will take OpenTelemetry traces from your services, draw the map of who calls whom, and show the slow endpoints and the waterfall of any request.",
    example:
      "Checkout takes 4 seconds at the 95th percentile. The trace waterfall shows 3.2 of them in one call from the order service to the stock service, repeated for every line of the cart. The fix is one batched call.",
  },
  who: ["Developers, who find the slow call", "SREs, who follow latency across services"],
  glance: [
    {
      label: "Takes",
      value: "OpenTelemetry traces",
    },
    {
      label: "Shows",
      value: "A service map",
    },
    {
      label: "Finds",
      value: "Slow endpoints",
    },
    {
      label: "Opens",
      value: "Any request as a waterfall",
    },
  ],
  flow: [
    {
      label: "Services send spans",
      detail: "Applications instrumented with OpenTelemetry send spans over OTLP.",
    },
    {
      label: "Assembled",
      detail: "Spans of one request become one trace.",
    },
    {
      label: "Summarized",
      detail: "A service map, and latency and errors per endpoint.",
    },
    {
      label: "Explored",
      detail: "Search traces and open any one as a waterfall.",
    },
  ],
  checks: [
    {
      title: "Views",
      items: [
        "Service map of who calls whom",
        "Slow endpoints and error rates",
        "Trace search by service, endpoint, duration and status",
        "Compare two periods",
      ],
    },
  ],
  decides: [
    {
      label: "Trace",
      text: "A trace is every span with the same trace id.",
    },
    {
      label: "Latency",
      text: "Latency percentiles are kept per service and endpoint.",
    },
  ],
  inputs: [
    {
      name: "OpenTelemetry",
      url: "https://opentelemetry.io/",
      how: "Traces over OTLP from SDKs and collectors.",
    },
  ],
  screens: [
    {
      page: "services",
      title: "Services",
      shows: "Every service with its request rate, errors and latency.",
      story: "services",
    },
    {
      page: "service-map",
      title: "Service map",
      shows: "Who calls whom, and where errors and latency come from.",
      story: "service-map",
    },
    {
      page: "trace-search",
      title: "Trace search",
      shows: "Find traces and open one as a waterfall.",
      story: "trace-search",
    },
  ],
  worksWith: [
    {
      id: "errors",
      how: "From an error to the trace of the request it happened in.",
    },
    {
      id: "metrics",
      how: "From a slow moment in a graph to the traces behind it.",
    },
    {
      id: "profiling",
      how: "From a slow span to the code that used the CPU.",
    },
  ],
  limits: ["It needs services instrumented with OpenTelemetry.", "Errors grouped into issues are the Errors product."],
};
