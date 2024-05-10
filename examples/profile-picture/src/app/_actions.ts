"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import {
  signOut as $signOut,
  currentUser,
  signIn,
  unstable_update,
} from "@/auth";
import { db } from "@/db/client";
import { User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";

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

export async function updateDisplayName(name: string) {
  const user = await currentUser();
  await Promise.all([
    unstable_update({
      user: {
        name,
      },
    }),
    db.update(User).set({ name }).where(eq(User.id, user.id)),
  ]);
  revalidatePath("/", "layout");
}

/**
 * Used to optimistically update the user's image
 * without waiting for `onUploadComplete` to finish
 * and updating the database record
 */
export async function updateUserImage(url: string) {
  await unstable_update({
    user: {
      image: url,
    },
  });
  revalidatePath("/", "layout");
}

export async function signOut() {
  await $signOut();
}
