# Agent Signal Directory

This directory is the **inter-agent communication hub** for the tafsil.net multi-agent development system.

## How It Works

Each agent writes its status to `agent-XX.status.json`. Other agents poll these files to know when dependencies are met.

## Files

| File | Owner | Purpose |
|---|---|---|
| `agent-01.status.json` | 🔵 Data Pipeline | PBI completion signals (DP-*) |
| `agent-02.status.json` | 🟢 Backend API | PBI completion signals (BE-*) |
| `agent-03.status.json` | 🟠 Mobile App | PBI completion signals (MOB-*) |
| `agent-04.status.json` | 🟣 Web App | PBI completion signals (WEB-*) |
| `agent-05.status.json` | 🟤 QA/Testing | Test completion signals (TEST-*) |
| `agent-06.status.json` | 🔴 Content | Content completion signals (CONT-*) |
| `schema-requests.md` | 🟢 Agent-02 writes, 🔵 Agent-01 reads | DB schema change requests |

## Status File Schema

```json
{
  "agent": "agent-XX",
  "phase": 1,
  "last_updated": "ISO-8601 timestamp",
  "completed": ["PBI-001", "PBI-002"],
  "in_progress": "PBI-003",
  "blocked": [],
  "messages": [
    {
      "to": "agent-XX",
      "message": "Description",
      "timestamp": "ISO-8601"
    }
  ]
}
```

## Rules

- Only the owning agent may WRITE to its own status file
- All agents may READ all status files
- `schema-requests.md` is written by Agent-02, read by Agent-01
- Messages are one-way notifications (not a chat system)
