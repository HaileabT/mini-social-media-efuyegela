const permissions = {
  admin: {
    categories: "crud",
    posts: "crud",
    comments: "crud",
    users: "crudp",
  },
  user: {
    posts: "crud",
    comments: "crud",
    categories: "r",
    users: "crud",
  },
} as const;

export const hasPermission = (
  role: keyof typeof permissions,
  resource: keyof (typeof permissions)["user"],
  action: "create" | "read" | "update" | "delete" | "promote"
): { hasPermission: boolean; error?: string } => {
  if (action === "promote" && role !== "admin") {
    return { hasPermission: false, error: "Insufficient permission." };
  }

  const rolePermissions = permissions[role as keyof typeof permissions];
  if (!rolePermissions) {
    return { hasPermission: false, error: "Invalid role" };
  }
  const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
  if (!resourcePermissions) {
    return { hasPermission: false, error: "Invalid resource" };
  }

  let hasPermission = resourcePermissions.includes(action.charAt(0));
  let error: string | undefined = undefined;
  if (!hasPermission) {
    error = "Insufficient permissions.";
  }

  return { hasPermission, error };
};
