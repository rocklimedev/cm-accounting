import Users from "@/concepts/users/Users";

const userRoutes = [
  {
    path: "users",
    superAdminOnly: true,
    element: <Users />,
  },
];

export default userRoutes;
