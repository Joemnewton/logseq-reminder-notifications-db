# Reminder Notifications (DB)

> Desktop + in-app reminders for scheduled blocks in Logseq’s database graphs.  
> Works great for daily planning on macOS, Windows, and Linux desktop builds of Logseq.

| Feature Pack | Highlights |
| --- | --- |
| ✅ Desktop notifications | Native OS toasts with custom icon + in-app banner |
| ✅ Multiple warning times | Comma-separated intervals (`15,5,0` etc.) |
| ✅ Quiet hours | Silence notifications overnight or during focus time |
| ✅ All-day support | Convert `scheduled:: 2025-10-14` into a reminder at your preferred time |

---

## Compatibility Cheat Sheet

| Supported | Not Supported |
| --- | --- |
| Logseq Desktop (macOS, Windows, Linux) running **DB graphs (SQLite)** | 📱 Logseq Mobile apps |
| `/reminders: rescan` command | File-based/Markdown graphs (use the [Markdown build](https://github.com/Joemnewton/logseq-reminder-notifications)) |
| Desktop + in-app notifications | Logseq web |

> **Tip:** Check `Settings → About → Graph format`. DB graphs live at `~/logseq/graphs/<graph-name>/db.sqlite`.

---

## Screenshots

![Desktop Notification](./screenshots/Desktop_Notification.png)
*Native OS toast fired from a scheduled block*

![In-App Message](./screenshots/In_App_Notification.png)
*Matching in-app reminder when you’re already inside Logseq*

---

## Quick Start

1. **Clone or download**
   ```bash
   git clone https://github.com/Joemnewton/logseq-reminder-notifications-db.git
   ```
2. **Load in Logseq**
   - `Settings → Plugins → Load unpacked plugin`
   - Select the folder you cloned.
3. **Enable notifications**
   - Allow desktop notifications when prompted and ensure your OS permits Logseq to notify you.

---

## Using Reminders

### Recommended DB-friendly format

```
- Plan project retro
  scheduled:: 2025-02-10 15:00
```

### Journal style (still supported)

```
SCHEDULED: <2025-02-10 Mon 15:00> Plan project retro
```

### Manual rescan

- Slash command: `/reminders: rescan`
- Command palette entry: “Reminder Notifications → Rescan now”

---

## Settings Reference

| Setting | Description |
| --- | --- |
| Default reminder intervals | Comma-separated minutes before the event (`15,5,0`) sorted automatically |
| Enable all-day reminders / time | Convert `scheduled:: 2025-02-10` into a reminder at e.g. `09:00` |
| Polling interval (seconds) | How frequently to check for upcoming reminders (10–300) |
| Daily rescan hour | Force a full DB rescan every day at the chosen hour |
| Quiet hours (start/end) | Silence notifications between the times you specify |
| Notification durations | Tune how long desktop / overdue / in-app banners stay on screen |

All settings live under `Settings → Plugins → Reminder Notifications`.

---

## Troubleshooting

1. **No notifications?**
   - Ensure you’re on the Desktop DB build (see Compatibility Cheat Sheet).
   - Verify the block uses a supported `scheduled::` value or journal timestamp.
   - Run `/reminders: rescan` and check Logseq’s developer console for output.
2. **Duplicate or late reminders?**
   - Confirm your OS clock and timezone are correct.
   - Keep the polling interval at 10–30 seconds for reliable cadence.
3. **Need Markdown graphs?**
   - Use the [Markdown-friendly build](https://github.com/Joemnewton/logseq-reminder-notifications).

---

## Development Notes

- This project targets Logseq DB APIs (`:block/title`, `:logseq.property/scheduled`) and is tested on v1.3.x desktop builds.
- Key logic lives in `index.js`. No external bundler is required—Logseq loads the file directly.
- Run `npm install` only if you add tooling; the plugin itself has zero runtime dependencies.

Contributions and bug reports are welcome through GitHub issues & pull requests.

---

## License

MIT © Joemnewton
