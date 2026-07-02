import React from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function ComingSoon({ title }) {
  return (
    <Layout title={title}>
      <Card className="border border-border rounded-md bg-card shadow-none p-10 text-center">
        <Construction className="h-8 w-8 mx-auto text-foreground/40" />
        <h2 className="text-base font-semibold mt-3">{title}</h2>
        <p className="text-sm text-foreground/60 mt-1">
          This module is being finalised and will be available shortly.
        </p>
      </Card>
    </Layout>
  );
}
