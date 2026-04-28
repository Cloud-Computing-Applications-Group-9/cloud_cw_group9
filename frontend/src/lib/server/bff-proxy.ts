import "server-only";

import { NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

export function shouldUseMockApi(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "1";
}

function cleanBaseUrl(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

function resolveBffBaseUrl(): string {
  const baseUrl =
    cleanBaseUrl(process.env.BFF_URL_INTERNAL) ||
    cleanBaseUrl(process.env.BFF_URL) ||
    cleanBaseUrl(process.env.NEXT_PUBLIC_BFF_URL);

  if (!baseUrl) {
    throw new Error("BFF_URL_INTERNAL is not configured");
  }
  return baseUrl;
}

function requestHeaders(req: Request): Headers {
  const headers = new Headers(req.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
  headers.delete("host");
  return headers;
}

function responseHeaders(headers: Headers): Headers {
  const nextHeaders = new Headers(headers);
  for (const header of HOP_BY_HOP_HEADERS) nextHeaders.delete(header);
  nextHeaders.delete("content-length");
  return nextHeaders;
}

export async function proxyBffRequest(
  req: Request,
  path: string,
): Promise<NextResponse> {
  let baseUrl: string;
  try {
    baseUrl = resolveBffBaseUrl();
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "BFF is not configured",
      },
      { status: 500 },
    );
  }

  const incomingUrl = new URL(req.url);
  const targetUrl = `${baseUrl}${path}${incomingUrl.search}`;
  const method = req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers: requestHeaders(req),
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const emptyBody = upstream.status === 204 || upstream.status === 304;
    return new NextResponse(emptyBody ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders(upstream.headers),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "BFF service unavailable",
        detail:
          error instanceof Error ? error.message : "Unknown upstream error",
      },
      { status: 502 },
    );
  }
}
