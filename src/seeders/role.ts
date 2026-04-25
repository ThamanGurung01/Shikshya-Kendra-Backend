import {Role} from "../models/role";
export const roleData=async()=>{
  const rolePermissions: Record<string, string[]> = {
    superadmin: ["*"],
    owner: ["manage_school", "view_reports", "manage_users"],
    admin: ["manage_users", "manage_students", "manage_teachers"],
    teacher: ["view_students", "manage_attendance"],
    student: ["view_classes"],
    parent: ["view_child"],
    librarian: ["manage_books"],
    accountant: ["manage_fees", "view_reports"],
  };

for (const [roleName, permissions] of Object.entries(rolePermissions)) {
await Role.findOneAndUpdate(
  { name: roleName },
  { 
    $set: { permissions },
    $setOnInsert: { name: roleName },
  },
  { upsert: true, returnDocument: "after" }
);
}
    console.log("Roles created");
}
