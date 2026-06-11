<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI Components

- Always prefer existing components in `src/components/ui`.
- If a needed component does not exist, search the current UI primitives first and compose/customize from them before creating new custom markup.
- Do not introduce one-off UI patterns when an existing `src/components/ui` component can be reused or extended.
- Every new or updated UI component must be checked for responsive behavior on small screens; avoid clipped dialogs, overflowing tables, and controls that become unusable on mobile.
