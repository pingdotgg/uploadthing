"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import { signOut as _signOut, signIn, unstable_update } from "@/auth";
import { AuthError } from "next-auth";

export async function signOut() {
  await _signOut();
}

export async function signInWithCredentials(
  _prevState: { error: string } | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    console.error("Uncaught error signing in", error);
    throw error;
  }
}

export async function signInWithGithub() {
  await signIn("github");
}

/**
 * Used to optimistically update the user's image
 * before it's in the database.
 */
export async function updateUserImage(url: string) {
  await unstable_update({
    user: {
      image: url,
    },
  });
  revalidatePath("/", "page");
}
