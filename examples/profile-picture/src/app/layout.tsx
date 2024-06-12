import type { Metadata } from "next";
import Link from "next/link";
import { UserMenu } from "@/app/_components/user-menu";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { GeistSans } from "geist/font/sans";
import { Menu, Package2, Search } from "lucide-react";
import { Toaster } from "sonner";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import "./globals.css";

import { Suspense } from "react";
import { auth } from "@/auth";
import { uploadRouter } from "@/uploadthing/server";

export const metadata: Metadata = {
  title: "UploadThing",
  description: "A User Profile Settings example",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.variable}>
        <NextSSRPlugin
          /**
           * The `extractRouterConfig` will extract **only** the route configs
           * from the router to prevent additional information from being
           * leaked to the client. The data passed to the client is the same
           * as if you were to fetch `/api/uploadthing` directly.
           */
          routerConfig={extractRouterConfig(uploadRouter)}
        />
        <div className="flex min-h-screen w-full flex-col">
          <header className="bg-background sticky top-0 flex h-16 items-center gap-4 border-b px-4 md:px-6">
            <Nav />
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
              <form className="ml-auto flex-1 sm:flex-initial">
                <div className="relative">
                  <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                  />
                </div>
              </form>
              <Suspense>
                <UserMenu user={auth().then((sesh) => sesh?.user ?? null)} />
              </Suspense>
            </div>
          </header>
          {children}
        </div>
      </body>
      <Toaster />
    </html>
  );
}

function Nav() {
  const Links = (
    <>
      <Link
        href="#"
        className="flex items-center gap-2 text-lg font-semibold md:text-base"
      >
        <Package2 className="h-6 w-6" />
        <span className="sr-only">Acme Inc</span>
      </Link>
      <Link
        href="#"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Dashboard
      </Link>
      <Link
        href="#"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Orders
      </Link>
      <Link
        href="#"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Products
      </Link>
      <Link
        href="#"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Customers
      </Link>
      <Link
        href="#"
        className="text-foreground hover:text-foreground transition-colors"
      >
        Settings
      </Link>
    </>
  );

  return (
    <>
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        {Links}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">{Links}</nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
