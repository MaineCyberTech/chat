import { type Router } from "express";
import healthRoutes from "./modules/health/routes.js";
import authRoutes from "./modules/auth/routes.js";
import workspaceRoutes from "./modules/workspaces/routes.js";
import channelRoutes from "./modules/channels/routes.js";
import messageRoutes from "./modules/messages/routes.js";
import webhookRoutes from "./modules/webhooks/routes.js";
import notificationRoutes from "./modules/notifications/routes.js";
import preferencesRoutes from "./modules/preferences/routes.js";
import reactionRoutes from "./modules/reactions/routes.js";
import featureFlagRoutes from "./modules/feature-flags/routes.js";
import consentRoutes from "./modules/consent/routes.js";
import threadRoutes from "./modules/threads/routes.js";
import liveKitRoutes from "./modules/livekit/routes.js";
import auditRoutes from "./modules/audit/routes.js";
import statusRoutes from "./modules/status/routes.js";
import emojiRoutes from "./modules/emoji/routes.js";
import userGroupRoutes from "./modules/user-groups/routes.js";
import sidebarRoutes from "./modules/sidebar/routes.js";
import scheduledRoutes from "./modules/scheduled-posts/routes.js";
import adminRoutes from "./modules/admin/routes.js";
import openApiRoutes from "./modules/openapi/routes.js";

export interface RouteEndpoint {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  middleware: string[];
  description: string;
}

export interface RouteEntry {
  path: string;
  router: Router;
  description: string;
  endpoints?: RouteEndpoint[];
}

export const routeRegistry: RouteEntry[] = [
  {
    path: "/",
    router: healthRoutes,
    description: "Health check + root endpoint",
    endpoints: [
      { method: "GET", path: "/health", middleware: [], description: "Readiness check" },
      { method: "GET", path: "/healthz", middleware: [], description: "Full health check (includes DB)" },
    ],
  },
  {
    path: "/v1/auth",
    router: authRoutes,
    description: "Authentication (magic link, status)",
    endpoints: [
      { method: "POST", path: "/v1/auth/magic-link", middleware: ["rate-limit"], description: "Send magic link email" },
      { method: "GET", path: "/v1/auth/status", middleware: ["authenticate"], description: "Get current user status" },
    ],
  },
  {
    path: "/v1/workspaces",
    router: workspaceRoutes,
    description: "Workspace CRUD + membership",
    endpoints: [
      { method: "GET", path: "/v1/workspaces", middleware: ["authenticate"], description: "List workspaces" },
      { method: "POST", path: "/v1/workspaces", middleware: ["authenticate"], description: "Create workspace" },
    ],
  },
  { path: "/v1", router: channelRoutes, description: "Channel CRUD + members + bookmarks" },
  { path: "/v1", router: messageRoutes, description: "Messages CRUD + pin/flag/forward" },
  { path: "/v1", router: webhookRoutes, description: "Webhook endpoints + deliveries" },
  { path: "/v1", router: notificationRoutes, description: "Notifications + push subscriptions" },
  { path: "/v1/auth", router: preferencesRoutes, description: "User preferences" },
  { path: "/v1", router: reactionRoutes, description: "Message reactions" },
  { path: "/v1", router: featureFlagRoutes, description: "Feature flags" },
  { path: "/v1", router: consentRoutes, description: "Consent logging" },
  { path: "/v1", router: threadRoutes, description: "Thread replies + participants" },
  { path: "/v1", router: liveKitRoutes, description: "LiveKit WebRTC tokens" },
  { path: "/v1", router: auditRoutes, description: "Audit log queries" },
  { path: "/v1", router: statusRoutes, description: "User presence status" },
  { path: "/v1", router: emojiRoutes, description: "Custom emoji CRUD" },
  { path: "/v1/groups", router: userGroupRoutes, description: "User groups CRUD" },
  { path: "/v1/sidebar-categories", router: sidebarRoutes, description: "Sidebar categories" },
  { path: "/v1/scheduled-posts", router: scheduledRoutes, description: "Scheduled posts" },
  { path: "/v1", router: openApiRoutes, description: "OpenAPI spec + changelog endpoints" },
  { path: "/v1/admin", router: adminRoutes, description: "Admin operations" },
];
