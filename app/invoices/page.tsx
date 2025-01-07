import { Metadata } from "next";
import { InvoicesTable } from "@/components/invoices-table";

export const metadata: Metadata = {
  title: "Invoices",
  description: "View and manage your podcast editing invoices",
};

export default async function InvoicesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            View and manage your podcast editing invoices
          </p>
        </div>
        <InvoicesTable />
      </div>
    </div>
  );
} 