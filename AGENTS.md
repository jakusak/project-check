# Agent Rules

- Admin password resets go through the `admin-set-password` edge function (service role, admin/super_admin or self only) — auth emails are unreliable for this project, so admins must be able to unlock users without email.
- Facilities projects use short hub keys (`fr`, `cz`, `it`, `hr`) with a mapping to legacy task hubs; keep both representations so existing requests remain intact.
- Facilities project writes are scoped by `facility_editors` and `can_edit_facility` in database policies; client access checks only shape the UI, not authorization.
