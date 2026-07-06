import { NextRequest, NextResponse } from "next/server";

const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:4000";

export const runtime = "nodejs";

async function handler(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await ctx.params;
    const pathStr = path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const qs = searchParams ? `?${searchParams}` : "";
    const targetUrl = `${API_ORIGIN}/v1/${pathStr}${qs}`;

    const contentType = request.headers.get("content-type") || "";
    const authHeader = request.headers.get("authorization") || "";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
      "x-forwarded-proto": request.headers.get("x-forwarded-proto") || "https",
    };

    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    let body: BodyInit | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseBody = await response.text();
    const parsedBody = (() => {
      try {
        return JSON.parse(responseBody);
      } catch {
        return responseBody;
      }
    })();

    return NextResponse.json(parsedBody, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: { message: "BFF proxy error" } },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
