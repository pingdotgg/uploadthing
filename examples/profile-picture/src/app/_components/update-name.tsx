"use client";

import { useActionState } from "react";
import { Button } from "@/ui/button";
import { CardContent, CardFooter } from "@/ui/card";
import { Input } from "@/ui/input";
import type { User } from "next-auth";
import { toast } from "sonner";

import { updateDisplayName } from "../_actions";

export function UpdateNameForm(props: { user: User }) {
  const [_, dispatch, isPending] = useActionState(
    async (_: void, fd: FormData) => {
      const name = fd.get("name");
      if (typeof name === "string") {
        await updateDisplayName(name);
        toast.success("Name updated");
      }
    },
    undefined,
  );

  return (
    <form action={dispatch}>
      <CardContent>
        <Input
          name="name"
          placeholder="John Doe"
          defaultValue={props.user.name ?? ""}
        />
      </CardContent>
      <CardFooter className="justify-between border-t px-6 py-4">
        Please use 32 characters at maximum.
        <p className="text-muted-foreground text-sm"></p>
        <Button size="sm" disabled={isPending}>
          Save
        </Button>
      </CardFooter>
    </form>
  );
}
