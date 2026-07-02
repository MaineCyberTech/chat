import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response body has name": (r) => r.body.includes("chat-api"),
  });
  sleep(1);
}
