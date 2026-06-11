# DESIGN.md — Job Tracker UI System

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI Library | shadcn v4 + @base-ui/react |
| Styling | Tailwind CSS v4 + OKLCH theme tokens |
| Icons | Lucide React |
| Utilities | cva, clsx, tailwind-merge |

## Theme

Light/dark mode via CSS custom properties (`globals.css`). OKLCH color space for perceptual consistency. System preference auto-detected.

## Design Tokens

- **Spacing**: `--spacing(4)` base unit (4px)
- **Radius**: `--radius` (0.5rem default)
- **Colors**: `--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--destructive`, `--card`, `--popover`, `--sidebar`
- **Fonts**: Geist Sans (body), Geist Mono (mono)

## Component Inventory

### Primitives (shadcn v4)

| Component | Path | Notes |
|-----------|------|-------|
| Button | `ui/button.tsx` | Variants: default, destructive, outline, secondary, ghost, link. Sizes: default, sm, lg, icon |
| Card | `ui/card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction |
| Badge | `ui/badge.tsx` | Variants: default, secondary, destructive, outline, ghost, link |
| Input | `ui/input.tsx` | Text input with ring focus state |
| Textarea | `ui/textarea.tsx` | Multiline input |
| Select | `ui/select.tsx` | Dropdown select (base-ui) |
| Dialog | `ui/dialog.tsx` | Modal dialog (base-ui) |
| AlertDialog | `ui/alert-dialog.tsx` | Confirmation modal |
| Sheet | `ui/sheet.tsx` | Slide-out panel |
| DropdownMenu | `ui/dropdown-menu.tsx` | Context menu (base-ui) |
| Tabs | `ui/tabs.tsx` | Tab navigation |
| Tooltip | `ui/tooltip.tsx` | Hover tooltip |
| Popover | `ui/popover.tsx` | Click popover |
| Command | `ui/command.tsx` | Command palette |
| Separator | `ui/separator.tsx` | Visual divider |
| Skeleton | `ui/skeleton.tsx` | Loading placeholder |
| Avatar | `ui/avatar.tsx` | User avatar |
| Switch | `ui/switch.tsx` | Toggle switch |
| Checkbox | `ui/checkbox.tsx` | Checkbox input |
| ScrollArea | `ui/scroll-area.tsx` | Custom scrollbar |
| Progress | `ui/progress.tsx` | Progress bar |
| Table | `ui/table.tsx` | Data table |
| Empty | `ui/empty.tsx` | Empty state container |
| Field | `ui/field.tsx` | Form field wrapper |
| Label | `ui/label.tsx` | Form label |
| InputGroup | `ui/input-group.tsx` | Input group wrapper |

### Custom Components

| Component | Path | Description |
|-----------|------|-------------|
| JobStatusBadge | `ui/job-status-badge.tsx` | Status badge with color coding for SAVED/APPLIED/INTERVIEWING/OFFER/REJECTED/ARCHIVED |
| StatCard | `ui/stat-card.tsx` | Analytics stat card with title, value, trend indicator |
| PageHeader | `ui/page-header.tsx` | Page header with title, description, action slot |
| SearchInput | `ui/search-input.tsx` | Search input with magnifying glass icon |
| ConfirmDialog | `ui/confirm-dialog.tsx` | Confirmation dialog wrapper over AlertDialog |
| JobCard | `ui/job-card.tsx` | Job listing card with status, actions dropdown |
| JobTable | `ui/job-table.tsx` | Sortable job table with inline actions |
| Loading Skeletons | `ui/loading-skeleton.tsx` | StatCardSkeleton, JobCardSkeleton, JobTableSkeleton, PageSkeleton |

## Status System

```
SAVED → APPLIED → INTERVIEWING → OFFER
                     ↓
                  REJECTED → ARCHIVED
```

Each status maps to a unique color:
- **SAVED**: Secondary (neutral)
- **APPLIED**: Blue
- **INTERVIEWING**: Amber
- **OFFER**: Emerald
- **REJECTED**: Destructive (red)
- **ARCHIVED**: Muted

## Architecture Patterns

- **Server Components** by default for data fetching
- **Client Components** (`"use client"`) only for interactivity
- `cn()` utility for class merging (clsx + tailwind-merge)
- `data-slot` attributes for component targeting
- `data-variant` for variant-based styling
- Compound component pattern (Card, Empty, Table)

## Pages (Planned)

1. **Dashboard** — Overview with stat cards, recent jobs, quick actions
2. **Jobs** — Table/card view with filters, search, sort
3. **Kanban** — Drag-and-drop board by status
4. **Reminders** — Upcoming/follow-up reminders
5. **Analytics** — Charts and stats over time
6. **Settings** — Profile, preferences
