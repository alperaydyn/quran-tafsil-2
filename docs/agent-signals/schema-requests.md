# Schema Change Requests

This file is used by **Agent-02 (Backend)** to request database schema changes from **Agent-01 (Data Pipeline)**.

Agent-01 owns all migration files. If Agent-02 needs schema changes during development, they describe the change here. Agent-01 checks this file periodically and creates the migration.

---

## Request Format

```
### REQ-XXX: [Brief Title]
- **Requested by:** Agent-02
- **Date:** YYYY-MM-DD
- **Priority:** P0/P1/P2
- **Status:** PENDING / IN_PROGRESS / DONE
- **Description:** What schema change is needed and why
- **Suggested SQL:** (optional) Agent-02's suggestion for the DDL
```

---

## Requests

*(No requests yet — Agent-02 will add requests here as needed)*
