import type { WorkspaceRole } from "./types.js";

export type Permission =
  | "workspace:manage_members"
  | "workspace:delete"
  | "workspace:update_settings"
  | "workspace:manage_webhooks"
  | "channel:create"
  | "channel:delete"
  | "channel:rename"
  | "channel:archive"
  | "channel:manage_members"
  | "channel:pin_messages"
  | "message:delete_any"
  | "message:edit_any"
  | "message:flag"
  | "message:pin"
  | "webhook:create"
  | "webhook:update"
  | "webhook:delete"
  | "audit:view";

const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    "workspace:manage_members",
    "workspace:delete",
    "workspace:update_settings",
    "workspace:manage_webhooks",
    "channel:create",
    "channel:delete",
    "channel:rename",
    "channel:archive",
    "channel:manage_members",
    "channel:pin_messages",
    "message:delete_any",
    "message:edit_any",
    "message:flag",
    "message:pin",
    "webhook:create",
    "webhook:update",
    "webhook:delete",
    "audit:view",
  ],
  admin: [
    "workspace:manage_members",
    "workspace:update_settings",
    "workspace:manage_webhooks",
    "channel:create",
    "channel:delete",
    "channel:rename",
    "channel:archive",
    "channel:manage_members",
    "channel:pin_messages",
    "message:delete_any",
    "message:edit_any",
    "message:flag",
    "message:pin",
    "webhook:create",
    "webhook:update",
    "webhook:delete",
    "audit:view",
  ],
  member: [
    "channel:create",
    "message:flag",
    "message:pin",
  ],
};

export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissionsForRole(role: WorkspaceRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export function getAllPermissions(): Permission[] {
  const all = new Set<Permission>();
  for (const perms of Object.values(ROLE_PERMISSIONS)) {
    for (const p of perms) {
      all.add(p);
    }
  }
  return [...all];
}
