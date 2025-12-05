import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "FoodRun - Food Delivery Platform",
    description: "Multi-vendor food delivery platform connecting restaurants, drivers, and customers in Poland",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.Node;
}>) {
    return (
        <html lang="pl">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
