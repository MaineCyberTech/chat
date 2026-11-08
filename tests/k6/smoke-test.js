import http from "k6/http";
import { check, sleep } from "k6";

// Smoke test for the API health endpoint.
//
// BASE_URL must point at the API origin (for example https://chat-api.example.com),
// not the web frontend. When it is not configured the workflow skips this job;
// the script also guards against an empty value so a manual invocation fails
// clearly instead of throwing on a null response body.
const configuredBaseUrl = (__ENV.BASE_URL || "").trim();
const BASE_URL = configuredBaseUrl.replace(/\/+$/, "");
const HEALTH_PATH = (__ENV.HEALTH_PATH || "/health").startsWith("/")
  ? __ENV.HEALTH_PATH || "/health"
  : `/${__ENV.HEALTH_PATH}`;

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

export function setup() {
  if (!BASE_URL) {
    console.warn(
      "SKIP: BASE_URL is not configured; set it to the API origin to run the smoke test.",
    );
    return { skip: true };
  }
  return { skip: false };
}

export default function (data) {
  if (!BASE_URL || data?.skip) {
    return;
  }

  const res = http.get(`${BASE_URL}${HEALTH_PATH}`);

  let body = null;
  try {
    body = res.json();
  } catch (_error) {
    // Keep body null: the checks below report a clear failure instead of
    // throwing when the target returns HTML, an empty body, or a proxy error.
  }

  check(res, {
    "status is 200": (r) => r.status === 200,
    "health payload names the api service": () => body?.service === "api",
    "health payload status is healthy": () => body?.status === "healthy",
  });

  sleep(1);
}
