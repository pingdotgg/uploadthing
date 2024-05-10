import Link from "next/link";
import LoginForm from "@/app/_components/login-form";
import { ProfilePictureCard } from "@/app/_components/profile-pic-uploader";
import { SignedIn, SignedOut } from "@/auth";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Input } from "@/ui/input";

export default async function Dashboard() {
  return (
    <main className="bg-muted/40 flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
      <SignedIn>
        {({ user }) => (
          <>
            <div className="mx-auto grid w-full max-w-6xl gap-2">
              <h1 className="text-3xl font-semibold">Settings</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
              <nav
                className="text-muted-foreground grid gap-4 text-sm"
                x-chunk="dashboard-04-chunk-0"
              >
                <Link href="#" className="text-primary font-semibold">
                  Profile
                </Link>
                <Link href="#">Security</Link>
                <Link href="#">Integrations</Link>
                <Link href="#">Support</Link>
                <Link href="#">Organizations</Link>
                <Link href="#">Advanced</Link>
              </nav>
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Display Name</CardTitle>
                    <CardDescription>
                      Please enter your full name, or a display name you are
                      comfortable with.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form>
                      <Input
                        disabled
                        placeholder="John Doe"
                        defaultValue={user.name ?? ""}
                      />
                    </form>
                  </CardContent>
                  <CardFooter className="justify-between border-t px-6 py-4">
                    <p className="text-muted-foreground text-sm">
                      Please use 32 characters at maximum.
                    </p>
                    <Button size="sm">Save</Button>
                  </CardFooter>
                </Card>
                <ProfilePictureCard user={user} />
              </div>
            </div>
          </>
        )}
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center gap-4">
          <LoginForm />
        </div>
      </SignedOut>
    </main>
  );
}
