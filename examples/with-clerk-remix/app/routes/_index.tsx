import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useAuth,
  UserButton,
} from "@clerk/remix";
import type { MetaFunction } from "@remix-run/node";

import { UploadButton } from "~/utils/uploadthing";

export const meta: MetaFunction = () => {
  return [
    { title: "Uploadthing x Remix" },
    {
      name: "description",
      content: "An example of using Uploadthing with Remix.",
    },
  ];
};

export default function Index() {
  const { isSignedIn } = useAuth();
  return (
    <main className="mx-auto max-w-screen-xl p-8 text-center">
      <h1 className="mb-4 text-3xl">Uploadthing x Remix</h1>

      <h1>Index Route</h1>
      <SignedIn>
        <p>You are signed in!</p>
        <div>
          <p>View your profile here</p>
          <UserButton />
        </div>
        <div>
          <SignOutButton />
        </div>
      </SignedIn>
      <SignedOut>
        <p>You are signed out</p>
        <div>
          <SignInButton />
        </div>
        <p>Sign in to upload</p>
      </SignedOut>

      <UploadButton
        disabled={!isSignedIn}
        endpoint="videoAndImage"
        onClientUploadComplete={(r) => console.log("Upload complete", r)}
      />
    </main>
  );
}
