import { type AppRole, type Profile } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type CurrentAccount = {
  profile: Profile;
};

async function getCurrentAccount(): Promise<CurrentAccount | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  const email = user.email.trim().toLowerCase();
  const fullName =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim().length > 0
      ? user.user_metadata.name.trim()
      : email.split("@")[0];

  const existingProfile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (existingProfile) {
    if (existingProfile.isBlocked) {
      await supabase.auth.signOut();
      return null;
    }

    return { profile: existingProfile };
  }

  const profile = await prisma.profile.create({
    data: {
      id: user.id,
      email,
      fullName,
    },
  });

  return { profile };
}

async function requireCurrentAccount() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/sign-in");
  }

  return account;
}

async function requireRole(role: AppRole) {
  const account = await requireCurrentAccount();

  if (account.profile.role !== role) {
    redirect("/dashboard");
  }

  return account;
}

export { getCurrentAccount, requireCurrentAccount, requireRole };
export type { CurrentAccount };
