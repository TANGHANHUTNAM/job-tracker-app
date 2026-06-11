import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const adminEmail = "admin@gmail.com";
const adminPassword = "admin123123";
const adminName = "Quản trị viên";

const defaultJobSources = [
  {
    name: "LinkedIn",
    slug: "linkedin",
    description: "Professional networking and job platform",
    sortOrder: 10,
  },
  {
    name: "TopCV",
    slug: "topcv",
    description: "Vietnam-based job platform",
    sortOrder: 20,
  },
  {
    name: "VietnamWorks",
    slug: "vietnamworks",
    description: "Vietnam-based recruitment platform",
    sortOrder: 30,
  },
  {
    name: "Indeed",
    slug: "indeed",
    description: "Global job search platform",
    sortOrder: 40,
  },
  {
    name: "Company Website",
    slug: "company-website",
    description: "Applied directly on a company website",
    sortOrder: 50,
  },
  {
    name: "Referral",
    slug: "referral",
    description: "Opportunity shared by a person in your network",
    sortOrder: 60,
  },
  {
    name: "Other",
    slug: "other",
    description: "Any source outside the predefined list",
    sortOrder: 70,
  },
];

async function main() {
  for (const source of defaultJobSources) {
    await prisma.jobSource.upsert({
      where: { slug: source.slug },
      update: {
        name: source.name,
        description: source.description,
        sortOrder: source.sortOrder,
        isActive: true,
      },
      create: {
        ...source,
        isActive: true,
      },
      });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY. Không thể seed tài khoản admin."
    );
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: listedUsers, error: listUsersError } =
    await supabase.auth.admin.listUsers();

  if (listUsersError) {
    throw listUsersError;
  }

  const existingAdmin = listedUsers.users.find(
    (user) => user.email?.toLowerCase() === adminEmail
  );

  let adminUserId = existingAdmin?.id;

  if (existingAdmin) {
    const { error: updateAdminError } = await supabase.auth.admin.updateUserById(
      existingAdmin.id,
      {
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName },
        app_metadata: { role: "admin" },
      }
    );

    if (updateAdminError) {
      throw updateAdminError;
    }
  } else {
    const { data: createdAdmin, error: createAdminError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName },
        app_metadata: { role: "admin" },
      });

    if (createAdminError || !createdAdmin.user) {
      throw createAdminError ?? new Error("Không thể tạo tài khoản admin.");
    }

    adminUserId = createdAdmin.user.id;
  }

  await prisma.profile.upsert({
    where: { id: adminUserId },
    update: {
      email: adminEmail,
      fullName: adminName,
      role: "ADMIN",
      isBlocked: false,
    },
    create: {
      id: adminUserId,
      email: adminEmail,
      fullName: adminName,
      role: "ADMIN",
      isBlocked: false,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
