/**
 * OpenAPI descriptions of the products that have one, read at build time from the product
 * repositories checked out next to this one (../vpn-manager, ../vulns, ../infra), like @openasy/ui.
 */
import type { ProductId } from "@openasy/ui";
import vpn from "../../../vpn-manager/openapi.json" with { type: "json" };
import vulns from "../../../vulns/openapi.json" with { type: "json" };
import infra from "../../../infra/openapi.json" with { type: "json" };

export interface Schema {
  $ref?: string;
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  format?: string;
  pattern?: string;
  description?: string;
  examples?: unknown[];
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  /** One of these shapes, such as null or an object. */
  oneOf?: Schema[];
  minimum?: number;
  maximum?: number;
}

interface Media {
  schema: Schema;
}

export interface Response {
  $ref?: string;
  description?: string;
  content?: Record<string, Media>;
}

export interface Operation {
  operationId: string;
  tags?: string[];
  summary?: string;
  description?: string;
  /** Alternatives: any one of these schemes, such as the ingest token or the admin token. */
  security?: Array<Record<string, string[] | undefined>>;
  requestBody?: { required?: boolean; content: Record<string, Media> };
  responses: Record<string, Response>;
}

export interface OpenApi {
  openapi: string;
  info: { title: string; version: string; summary?: string; description?: string };
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, Record<string, Operation>>;
  components: {
    schemas: Record<string, Schema>;
    responses?: Record<string, Response>;
    securitySchemes?: Record<string, { type: string; scheme?: string; description?: string }>;
  };
}

export interface ApiInfo {
  spec: OpenApi;
  /** Repository the description comes from. */
  repo: string;
}

export const APIS: Partial<Record<ProductId, ApiInfo>> = {
  vpn: { spec: vpn as OpenApi, repo: "openasy/vpn-manager" },
  vulnerabilities: { spec: vulns as OpenApi, repo: "openasy/vulns" },
  infrastructure: { spec: infra as OpenApi, repo: "openasy/infra" },
};

export const apiFor = (id: string): ApiInfo | undefined => APIS[id as ProductId];

/** Follows a local "#/components/..." reference. */
export function resolve<T extends { $ref?: string }>(spec: OpenApi, value: T): T {
  if (!value.$ref) return value;
  const target = value.$ref.replace(/^#\//, "").split("/").reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], spec);
  return resolve(spec, target as T);
}

export const METHODS = ["get", "post", "put", "patch", "delete"] as const;
