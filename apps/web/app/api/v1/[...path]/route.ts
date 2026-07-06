import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:4000";

export async function GET(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx);
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx);
}

async function proxy(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await ctx.params;
    const pathStr = path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const qs = searchParams ? `?${searchParams}` : "";
    const targetUrl = `${API_ORIGIN}/v1/${pathStr}${qs}`;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
          },
        },
      },
    );

    const { data: { session } } = await supabase.auth.getSession();

    let body: BodyInit | undefined;
    const contentType = request.headers.get("content-type") || "";
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.text();
    }

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
      "x-forwarded-proto": request.headers.get("x-forwarded-proto") || "https",
    };

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
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
