import { NextRequest, NextResponse } from "next/server";

const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const runtime = "nodejs";

async function handler(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await ctx.params;
    const pathStr = path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const qs = searchParams ? `?${searchParams}` : "";
    const targetUrl = `${API_ORIGIN}/${pathStr}${qs}`;

    const headers: Record<string, string> = {};
    const contentType = request.headers.get("content-type") || "";
    if (contentType) headers["Content-Type"] = contentType;

    const authHeader = request.headers.get("authorization") || "";
    if (authHeader) headers["Authorization"] = authHeader;

    const cookieHeader = request.headers.get("cookie") || "";
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    let body: BodyInit | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseBody = await response.text();
    const parsedBody = (() => {
      try {
        return JSON.parse(responseBody);
      } catch {
        return responseBody;
      }
    })();

    const res = NextResponse.json(parsedBody, { status: response.status });

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      res.headers.set("set-cookie", setCookie);
    }

    return res;
  } catch (err) {
    console.error("BFF proxy error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: { message: "BFF proxy error", detail: message } },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
