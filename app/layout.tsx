import { Inter } from "next/font/google";
import { MainNav } from "@/components/main-nav";
import { UserButton } from "@clerk/nextjs";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Podcasts",
  description: "Podcast editing invoice management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-background">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-14 items-center justify-between border-b">
                <MainNav />
                <UserButton afterSignOutUrl="/" />
              </div>
              {children}
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
