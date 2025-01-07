import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Subscription",
  description: "Subscribe to our premium podcast service",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 