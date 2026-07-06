import React from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import UsersTab from "../../components/user-roles/UsersTab";
import RolesTab from "../../components/user-roles/RolesTab";

export default function UsersAndRoles() {
  return (
    <Layout title="Users & Permissions">
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
