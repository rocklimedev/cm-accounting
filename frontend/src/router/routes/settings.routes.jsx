import EncryptionKeys from "@/concepts/settings/EncryptionKeys";

const settingsRoutes = [
  {
    path: "encryption-keys",
    adminOnly: true,
    element: <EncryptionKeys />,
  },
];

export default settingsRoutes;
