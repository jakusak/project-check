# Agent Rules

- Admin password resets go through the `admin-set-password` edge function (service role, admin/super_admin or self only) — auth emails are unreliable for this project, so admins must be able to unlock users without email.
