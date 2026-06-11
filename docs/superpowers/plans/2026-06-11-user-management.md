# User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trang quản trị người dùng cho admin với tạo user mới, chỉnh sửa họ tên và vai trò, active/deactive tài khoản, cùng search, filter và sort theo yêu cầu.

**Architecture:** Giữ pattern đang dùng ở dashboard: server page đọc `searchParams` và query Prisma, client manager xử lý toolbar, table actions, dialogs và toast, server actions xử lý thay đổi dữ liệu. Tạo user mới sẽ đi qua Supabase Admin API để tạo auth user thật rồi đồng bộ bảng `profiles`; deactive user dùng `isBlocked` và guard session để đá user ra ở request kế tiếp.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, Supabase Auth Admin API, Sonner, UI primitives trong `src/components/ui`.

---

## File Map

- `src/app/dashboard/users/page.tsx`
  - Query user list theo `q`, `role`, `status`, `sort`, truyền dữ liệu vào manager.
- `src/app/dashboard/users/users-manager.tsx`
  - Toolbar search/filter/sort, bảng danh sách, dialog tạo/chỉnh sửa, confirm active/deactive.
- `src/app/dashboard/users/actions.ts`
  - `createUser`, `updateUser`, `toggleUserStatus` với kiểm tra quyền admin.
- `src/app/dashboard/users/types.ts`
  - Kiểu input/output dùng chung.
- `src/lib/auth/session.ts`
  - Chặn và sign-out user bị block ở request kế tiếp.
- `src/lib/supabase/admin.ts`
  - Helper tạo Supabase admin client bằng `SUPABASE_SERVICE_ROLE_KEY`.

### Task 1: Add Supabase Admin Helper

**Files:**
- Create: `src/lib/supabase/admin.ts`

- [ ] **Step 1: Create admin helper**

```ts
import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { createAdminClient };
```

- [ ] **Step 2: Run lint for new helper**

Run: `npm run lint`
Expected: lint passes with no new errors

### Task 2: Add Shared User Action Types

**Files:**
- Create: `src/app/dashboard/users/types.ts`

- [ ] **Step 1: Create action input types**

```ts
import type { AppRole } from "@prisma/client";

type UserRoleFilter = "" | AppRole;
type UserStatusFilter = "" | "active" | "inactive";

type CreateUserInput = {
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
};

type UpdateUserInput = {
  id: string;
  fullName: string;
  role: AppRole;
};

type ToggleUserStatusInput = {
  id: string;
  nextBlockedState: boolean;
};

export type { CreateUserInput, ToggleUserStatusInput, UpdateUserInput, UserRoleFilter, UserStatusFilter };
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no type errors

### Task 3: Create Admin User Server Actions

**Files:**
- Create: `src/app/dashboard/users/actions.ts`
- Modify: `src/lib/auth/session.ts`
- Modify: `src/lib/auth/actions.ts`

- [ ] **Step 1: Add create/update/toggle server actions**

Core requirements for `src/app/dashboard/users/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateUserInput, ToggleUserStatusInput, UpdateUserInput } from "./types";

type ActionResult = {
  success: boolean;
  message: string;
};
```

Implementation rules:
- `createUser(input)`
  - `await requireRole("ADMIN")`
  - validate required fields
  - normalize email lowercase
  - reject password `< 6`
  - reject duplicate `Profile.email`
  - create auth user via `admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: fullName } })`
  - create/upsert `Profile` with `id`, `email`, `fullName`, `role`, `isBlocked: false`
  - `revalidatePath("/dashboard/users")`
- `updateUser(input)`
  - admin only
  - update `Profile.fullName`, `Profile.role`
  - also update Supabase auth metadata name if convenient and low-risk
- `toggleUserStatus(input)`
  - admin only
  - update `Profile.isBlocked`
  - also call Supabase Admin API to ban/unban auth user using the matching block flag supported by the project code path
  - refuse blocking the final remaining admin if query shows only one active admin left and target is that admin

- [ ] **Step 2: Strengthen sign-in guard for blocked users**

In `src/lib/auth/actions.ts`, after successful `signInWithPassword`, query `prisma.profile.findUnique({ where: { email } })` and if `isBlocked` is true:

```ts
await supabase.auth.signOut();
return { error: "Tài khoản của bạn đã bị vô hiệu hóa." };
```

- [ ] **Step 3: Strengthen request-time guard**

In `src/lib/auth/session.ts`, after loading existing profile:

```ts
if (existingProfile.isBlocked) {
  await supabase.auth.signOut();
  return null;
}
```

This guarantees a blocked user gets redirected out on the next request.

- [ ] **Step 4: Run validation**

Run: `npm run lint && npx tsc --noEmit`
Expected: both commands pass

### Task 4: Replace Users Page Query Logic

**Files:**
- Modify: `src/app/dashboard/users/page.tsx`

- [ ] **Step 1: Replace sample UI with real query-driven page**

Structure the page similar to `src/app/dashboard/jobs/page.tsx`:

```ts
import { type AppRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { UsersManager } from "./users-manager";
```

Query rules:
- `q`: search in `fullName` OR `email` with `contains`, insensitive
- `role`: `ADMIN` or `USER`
- `status`: `active` => `isBlocked: false`, `inactive` => `isBlocked: true`
- `sort`: `desc` default, `asc` optional

Fetch:

```ts
const users = await prisma.profile.findMany({
  where,
  orderBy: { createdAt: sort },
});
```

Pass filters and rows into `UsersManager`.

- [ ] **Step 2: Remove all sample fallback data**

Expected result: page always uses real DB rows, empty state handled in manager.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no type errors

### Task 5: Build Users Manager UI

**Files:**
- Create: `src/app/dashboard/users/users-manager.tsx`

- [ ] **Step 1: Create toolbar and filters**

Use existing primitives mirroring `jobs-manager.tsx`:
- `PageHeader`
- `SearchInput`
- `Select`
- `Card`
- `Button`

Toolbar requirements:
- search input bound to `q`
- role filter bound to `role`
- status filter bound to `status`
- sort bound to `sort`
- button `Tạo người dùng`

Use URL query updates with `useRouter`, `usePathname`, `useSearchParams`.

- [ ] **Step 2: Create create/edit dialogs**

Implement two modes in one dialog:
- create mode: `fullName`, `email`, `password`, `role`
- edit mode: `fullName`, `role`

Validation rules:
- create: all 4 required
- edit: `fullName`, `role` required

Use:
- `Field`, `FieldLabel`, `FieldError`, `FieldGroup`
- `Input`
- `Select`
- `Dialog`

- [ ] **Step 3: Create users table**

Columns:
- Họ tên
- Email
- Vai trò
- Trạng thái
- Ngày tạo
- Hành động

Actions:
- `Chỉnh sửa`
- `Vô hiệu hóa` / `Kích hoạt`

Badges:
- role badge like current page
- status badge using `outline` or `destructive`

- [ ] **Step 4: Add confirm dialog for active/deactive**

Use `ConfirmDialog` with contextual title/message:

```ts
title={user.isBlocked ? "Kích hoạt tài khoản?" : "Vô hiệu hóa tài khoản?"}
```

- [ ] **Step 5: Wire actions and toasts**

Action flow:
- submit create -> `createUser`
- submit edit -> `updateUser`
- confirm toggle -> `toggleUserStatus`
- success -> `toast.success`, close dialog, `router.refresh()`
- error -> `toast.error`

- [ ] **Step 6: Add empty state**

When no rows:
- show `Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription`
- message should explain no users match current filter

- [ ] **Step 7: Run validation**

Run: `npm run lint && npx tsc --noEmit`
Expected: both commands pass

### Task 6: Verify End-To-End Behavior

**Files:**
- Modify: `src/app/dashboard/users/page.tsx`
- Modify: `src/app/dashboard/users/users-manager.tsx`
- Modify: `src/app/dashboard/users/actions.ts`
- Modify: `src/lib/auth/session.ts`
- Modify: `src/lib/auth/actions.ts`
- Modify: `src/lib/supabase/admin.ts`
- Modify: `src/app/dashboard/users/types.ts`

- [ ] **Step 1: Verify create user flow manually**

Run app, then verify:
- admin opens `/dashboard/users`
- creates a user with email/password/role/fullName
- new row appears after refresh

Expected: success toast and user appears in list.

- [ ] **Step 2: Verify edit flow manually**

Edit a user’s `fullName` and `role`.

Expected: success toast and row updates correctly.

- [ ] **Step 3: Verify inactive filter and blocked login behavior**

Manual checks:
- deactivate a user
- list row changes to inactive
- filter by inactive shows the row
- sign-in with that user returns blocked message

Expected: blocked user cannot access dashboard and is redirected out on next request.

- [ ] **Step 4: Final validation**

Run: `npm run lint && npx tsc --noEmit`
Expected: both commands pass cleanly
