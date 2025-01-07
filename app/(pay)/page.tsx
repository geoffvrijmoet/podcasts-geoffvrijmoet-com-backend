"use client";

import { Suspense } from "react";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function PaymentPortalContent() {
  const [loading, setLoading] = useState(false);
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { sessionId } = await response.json();
      
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error("Error:", error);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Subscribe to Premium</CardTitle>
          <CardDescription>
            Get access to exclusive podcast content and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Premium Membership</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Exclusive Content Access
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Ad-Free Experience
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Early Access to Episodes
                </li>
              </ul>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? "Processing..." : "Subscribe Now"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPortal() {
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
      <PaymentPortalContent />
    </Suspense>
  );
} 