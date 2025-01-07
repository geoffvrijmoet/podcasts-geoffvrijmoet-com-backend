"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (sessionId) {
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Processing...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent>
            <p>We couldn&apos;t verify your payment. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Thank you for subscribing to our premium podcast service!</p>
            <p>You now have access to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Exclusive Content</li>
              <li>Ad-Free Experience</li>
              <li>Early Access to Episodes</li>
            </ul>
            <p>Your subscription is now active and you can start enjoying premium features right away.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Please wait...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
} 