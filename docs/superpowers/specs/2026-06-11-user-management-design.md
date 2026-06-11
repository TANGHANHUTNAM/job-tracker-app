# User Management Design

**Goal:** Xây dựng trang quản trị người dùng cho admin với khả năng tạo user mới, chỉnh sửa họ tên và vai trò, kích hoạt/vô hiệu hóa tài khoản, đồng thời hỗ trợ tìm kiếm, lọc và sắp xếp danh sách.

## Scope

- Trang `Người dùng` chỉ dành cho `ADMIN`.
- Danh sách user hỗ trợ:
  - tìm kiếm theo `fullName`, `email`
  - lọc theo `role`
  - lọc theo trạng thái `active/deactive`
  - sắp xếp theo `createdAt`
- CRUD trong phạm vi đã chốt:
  - tạo user mới: `fullName`, `email`, `password`, `role`
  - chỉnh sửa user: `fullName`, `role`
  - không xóa cứng user
  - deactive/active user bằng `isBlocked`

## UX

- Dùng layout/dashboard pattern đang có sẵn giống `jobs` và `job-sources`.
- Dùng `Dialog` cho tạo và chỉnh sửa user.
- Dùng `ConfirmDialog` cho active/deactive.
- Dùng toast cho mọi thao tác thành công/thất bại.
- Các field bắt buộc có dấu `*` đỏ và lỗi hiển thị rõ ràng.

## Data Model And Behavior

- Dữ liệu chính dùng bảng `profiles` qua model `Profile`.
- `role` dùng enum `AppRole`.
- `isBlocked = true` nghĩa là tài khoản bị vô hiệu hóa.
- Khi deactive:
  - user bị chặn đăng nhập mới
  - user đang đăng nhập sẽ bị đá ra ở request kế tiếp thông qua session guard hiện có
  - dữ liệu ứng tuyển vẫn giữ nguyên

## Backend Approach

- Query danh sách user ở server page bằng `searchParams` để giữ URL-driven filtering.
- Tạo user mới cần tạo auth user thật trong Supabase Admin API, sau đó tạo/upsert `Profile` tương ứng.
- Chỉnh sửa user cập nhật `Profile.fullName` và `Profile.role`.
- Active/deactive cập nhật `Profile.isBlocked` và đồng bộ trạng thái auth nếu cần.

## Files

- `src/app/dashboard/users/page.tsx`
  - server component đọc query params, query Prisma, truyền props cho client manager
- `src/app/dashboard/users/users-manager.tsx`
  - client component cho toolbar search/filter/sort, table actions, dialogs, toasts
- `src/app/dashboard/users/actions.ts`
  - server actions cho create/update/toggle status
- `src/app/dashboard/users/types.ts`
  - shared input/result types cho actions
- `src/lib/auth/session.ts`
  - bảo đảm user bị block sẽ bị từ chối ở request kế tiếp nếu chưa có guard đầy đủ

## Constraints

- Giữ thay đổi nhỏ gọn, bám pattern đang có.
- Ưu tiên tái sử dụng component trong `src/components/ui`.
- Không thêm xóa cứng user.
- Không thay đổi flow auth ngoài phần cần thiết để xử lý blocked user.

## Acceptance Criteria

- Admin xem được danh sách user thật từ DB.
- Admin tìm kiếm được theo họ tên hoặc email.
- Admin lọc được theo vai trò và trạng thái.
- Admin sắp xếp được theo ngày tạo mới nhất/cũ nhất.
- Admin tạo được user mới với email/password/role/fullName.
- Admin chỉnh sửa được họ tên và vai trò.
- Admin deactive/active được user.
- User bị deactive không đăng nhập mới được và bị đá ra ở request kế tiếp nếu đang còn session.
