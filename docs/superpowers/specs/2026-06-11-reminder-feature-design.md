# Reminder Feature Design

**Goal:** Triển khai tính năng nhắc nhở (Reminder) để người dùng theo dõi các mốc hành động liên quan đến quá trình ứng tuyển và quản trị viên có thể quan sát/quản lý toàn bộ reminder trong hệ thống.

## Scope

- Thêm tab `Nhắc nhở` trong dashboard cho cả `USER` và `ADMIN`.
- Tạo danh sách reminder với các trường:
  - `title`
  - `reminderDate`
  - `type`
  - `jobApplicationId` tùy chọn
  - `isCompleted`
- Hỗ trợ thao tác:
  - tạo reminder
  - chỉnh sửa reminder
  - xóa reminder
  - đánh dấu hoàn thành/chưa hoàn thành
- Hỗ trợ bộ lọc tối thiểu:
  - tìm theo `title`
  - lọc theo `status` mở/đã hoàn thành
  - lọc theo `type`
  - sort theo `reminderDate`

## Role Behavior

- `USER` chỉ xem và thao tác reminder của chính mình.
- `ADMIN` xem và thao tác trên toàn bộ reminder.

## UX

- Dùng layout và pattern giống `jobs`, `users`, `job-sources`.
- Dùng `Dialog` cho form tạo/chỉnh sửa.
- Dùng `ConfirmDialog` cho xóa reminder.
- Dùng `Select`, `SearchInput`, `DatePicker`, `Table`, `Badge`, `Empty` từ `src/components/ui`.
- Hiển thị trạng thái reminder bằng badge `Đang mở` / `Đã hoàn thành`.

## Data Flow

- Server page đọc `searchParams` và query Prisma.
- Client manager xử lý toolbar, dialog, table actions, toast.
- Server actions xử lý tạo/sửa/xóa/toggle completion.
- Reminder có thể gắn với `JobApplication` hiện có của user; admin có thể gắn với mọi job.

## Acceptance Criteria

- Có tab `Nhắc nhở` trong dashboard.
- User tạo được reminder với ngày nhắc và loại nhắc.
- Reminder có thể gắn tùy chọn với một job cụ thể.
- User/admin lọc và tìm kiếm được reminder.
- Có thể đánh dấu hoàn thành/chưa hoàn thành.
- Dashboard admin card `Nhắc nhở mở` tiếp tục hoạt động với dữ liệu thật.
