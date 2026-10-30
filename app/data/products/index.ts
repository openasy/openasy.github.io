import type { ProductId } from "@openasy/ui";
import { access } from "./access";
import { alerts } from "./alerts";
import { analytics } from "./analytics";
import { audience } from "./audience";
import { campaigns } from "./campaigns";
import { consent } from "./consent";
import { crm } from "./crm";
import { forms } from "./forms";
import { mail } from "./mail";
import { messages } from "./messages";
import { assistant } from "./assistant";
import { attackSimulation } from "./attack-simulation";
import { attackSurface } from "./attack-surface";
import { audit } from "./audit";
import { automation } from "./automation";
import { awareness } from "./awareness";
import { backups } from "./backups";
import { certificates } from "./certificates";
import { compliance } from "./compliance";
import { cost } from "./cost";
import { dast } from "./dast";
import { database } from "./database";
import { deception } from "./deception";
import { endpoints } from "./endpoints";
import { errors } from "./errors";
import { identity } from "./identity";
import { incidents } from "./incidents";
import { infrastructure } from "./infrastructure";
import { logs } from "./logs";
import { malware } from "./malware";
import { metrics } from "./metrics";
import { networkIds } from "./network-ids";
import { posture } from "./posture";
import { profiling } from "./profiling";
import { risk } from "./risk";
import { runtime } from "./runtime";
import { sast } from "./sast";
import { secrets } from "./secrets";
import { siem } from "./siem";
import { supplyChain } from "./supply-chain";
import { threatIntel } from "./threat-intel";
import { traces } from "./traces";
import { uptime } from "./uptime";
import { vpn } from "./vpn";
import { vulnerabilities } from "./vulnerabilities";
import { waf } from "./waf";
import SHOTS from "./screens.json";
import type { ProductStory } from "./types";

export type { CheckGroup, FlowStep, Input, Link, ProductStory, Screen } from "./types";

/** What each product is for and how it works, by product id. */
export const STORIES: Record<ProductId, ProductStory> = {
  access,
  alerts,
  analytics,
  audience,
  campaigns,
  consent,
  crm,
  forms,
  mail,
  messages,
  assistant,
  "attack-simulation": attackSimulation,
  "attack-surface": attackSurface,
  audit,
  automation,
  awareness,
  backups,
  certificates,
  compliance,
  cost,
  dast,
  database,
  deception,
  endpoints,
  errors,
  identity,
  incidents,
  infrastructure,
  logs,
  malware,
  metrics,
  "network-ids": networkIds,
  posture,
  profiling,
  risk,
  runtime,
  sast,
  secrets,
  siem,
  "supply-chain": supplyChain,
  "threat-intel": threatIntel,
  traces,
  uptime,
  vpn,
  vulnerabilities,
  waf,
};

export const storyFor = (id: string): ProductStory | undefined => STORIES[id as ProductId];

/** A screen's screenshot, for the light or dark theme. */
export const screenshot = (id: string, page: string, theme: "light" | "dark") => `/screens/${id}/${page}-${theme}.webp`;

/** The screens that have screenshots, by product: kit/screens/capture.mjs writes the list as it takes them. */
export const hasScreenshot = (id: string, page: string): boolean => ((SHOTS as Record<string, string[]>)[id] ?? []).includes(page);
