import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "FoodRun - Food Delivery Platform",
    description: "Multi-vendor food delivery platform connecting restaurants, drivers, and customers in Poland",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl">
            <body className="antialiased">{children}</body>
        </html>
    );
}
