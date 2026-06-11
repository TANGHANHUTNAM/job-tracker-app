# Reminder Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm trang quản lý reminder cho cả user và admin với CRUD, bộ lọc cơ bản, và gắn tùy chọn với job application.

**Architecture:** Dùng server page để đọc query params và query Prisma, client manager để render toolbar/table/dialog, server actions để mutate dữ liệu. Điều hướng dashboard được mở rộng thêm tab `Nhắc nhở` và phân quyền dùng lại `requireCurrentAccount`/`requireRole` hiện có.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, Sonner, UI primitives nội bộ.

---

## File Map

- `src/app/dashboard/layout.tsx`
  - Thêm nav item `Nhắc nhở`.
- `src/app/dashboard/reminders/page.tsx`
  - Query reminder list, query job options, truyền xuống manager.
- `src/app/dashboard/reminders/reminders-manager.tsx`
  - Toolbar, table, dialogs, toast, filters.
- `src/app/dashboard/reminders/actions.ts`
  - create/update/delete/toggle completion.
- `src/app/dashboard/reminders/types.ts`
  - Shared types.
