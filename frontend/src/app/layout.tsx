import type { Metadata } from "next";
import { WalletProvider } from "@/providers/WalletProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Nexus DApps",
  description: "Decentralized applications on Nexus Network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-['Arial',_'Helvetica',_sans-serif']">
        <WalletProvider>
          <NotificationProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              {children}
              <Footer />
            </div>
          </NotificationProvider>
        </WalletProvider>
      </body>
    </html>
  );
}