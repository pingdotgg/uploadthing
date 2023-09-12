import "@uploadthing/react/styles.css";
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: 'Next.js 13 with Clerk',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className={inter.className}>{children}</body>
            </html>
        </ClerkProvider>
    )
}