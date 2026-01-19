# Reminder Notifications (Database)

> **Desktop + in-app reminders for scheduled blocks living in Logseq's Database (DB) graphs.**
> Works with Database graphs on Logseq Desktop for macOS, Windows, and Linux.

---

## 🎯 Feature Pack

| Feature | Highlights |
| --- | --- |
| ✅ **Desktop notifications** | Native OS toasts (desktop) + Logseq in-app banners |
| ✅ **Multiple warning times** | Comma-separated intervals (`15,5,0`) |
| ✅ **Quiet hours** | Silence reminders overnight or during focus time |
| ✅ **All-day support** | Convert `scheduled:: 2025-10-14` into a reminder at your preferred time |

---

## 📸 Screenshots

### Desktop Notification
![Desktop Notification](./screenshots/Desktop_Notification.png)
*Native OS toast notification with custom icon and auto-dismiss*

### In-App Notification
![In-App Notification](./screenshots/In_App_Notification.png)
*Matching in-app reminder banner when you're already using Logseq*

---

## ✅ Compatibility

| ✅ Supported | ❌ Not Supported |
| --- | --- |
| **Logseq Desktop** (macOS, Windows, Linux) running **DB graphs (SQLite)** | 📱 Logseq Mobile apps |
| `/reminders: rescan` manual command | File-based/Markdown graphs |
| Desktop + in-app notifications | Logseq web version |

> **💡 Tip:** Check `Settings → About → Graph format`. DB graphs are stored at `~/logseq/graphs/<graph-name>/db.sqlite`.

---

## 🚀 Quick Start

### 1. Installation

**Option A: Clone from GitHub**
```bash
git clone https://github.com/Joemnewton/logseq-reminder-notifications-db.git
```

**Option B: Download ZIP**
- Download from the [GitHub repository](https://github.com/Joemnewton/logseq-reminder-notifications-db)
- Extract the ZIP file

### 2. Load in Logseq
1. Open Logseq
2. Go to `Settings → Plugins`
3. Click `Load unpacked plugin`
4. Select the plugin folder

### 3. Enable Notifications
- Allow desktop notifications when prompted
- Ensure your OS permits Logseq to send notifications
  - **macOS**: System Settings → Notifications → Logseq
  - **Windows**: Settings → System → Notifications → Logseq
  - **Linux**: Depends on your desktop environment

### 4. Test Notifications (Important for macOS)

If Logseq isn't showing up in your macOS Notification settings, you need to trigger a notification first:

**Create a test reminder:**
1. In any Logseq page, create a block with a scheduled time 2 minutes from now:
   ```markdown
   - Test reminder
     scheduled:: 2025-01-19 14:35
   ```
   (Replace with current date/time + 2 minutes)

2. Run the rescan command: `/reminders: rescan`

3. Wait for the notification to appear (it will trigger the macOS permission dialog)

4. Click **Allow** when prompted

5. Verify Logseq now appears in: **System Settings → Notifications → Logseq**

6. Ensure notifications are enabled and set to "Alerts" (not "Banners") for persistent notifications

**Note:** If you recently reinstalled Logseq, it won't appear in macOS Notifications until the first notification is triggered.

---

## 📝 Using Reminders

### Recommended DB-friendly format

The property-based format works best with DB graphs:

```markdown
- Plan project retro
  scheduled:: 2025-02-10 15:00
```

### Journal style (still supported)

The legacy format also works:

```markdown
SCHEDULED: <2025-02-10 Mon 15:00> Plan project retro
```

### All-day reminders

Enable in settings to get notified at your preferred time:

```markdown
- Team meeting
  scheduled:: 2025-02-10
```

This will trigger a reminder at your configured time (default: 9:00 AM).

### Manual rescan

If you don't see notifications for newly scheduled items:

- **Slash command**: `/reminders: rescan`
- **Keyboard shortcut**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- **Command palette**: "Rescan for scheduled reminders"

---

## ⚙️ Settings Reference

Access settings via `Settings → Plugins → Reminder Notifications`

| Setting | Description | Default |
| --- | --- | --- |
| **Default reminder intervals** | Comma-separated minutes before event (`15,5,0`) | `0,5` |
| **Enable all-day reminders** | Convert date-only schedules into timed reminders | `false` |
| **All-day reminder time** | Time to send all-day reminders (24-hour format) | `09:00` |
| **Polling interval** | How often to check for due reminders (10-300 seconds) | `30` |
| **Daily rescan hour** | Hour of day to force full DB rescan (0-23) | `3` |
| **Enable quiet hours** | Silence notifications during specified hours | `false` |
| **Quiet hours start** | Hour to start quiet period (0-23, e.g., 22 = 10 PM) | `22` |
| **Quiet hours end** | Hour to end quiet period (0-23, e.g., 7 = 7 AM) | `7` |
| **In-app notification duration** | How long in-app banners stay visible (5-120 seconds) | `30` |
| **Desktop notification duration** | How long desktop toasts stay visible (5-300 seconds) | `30` |
| **Overdue notification duration** | How long overdue notifications stay visible (10-300 seconds) | `60` |

---

## 🔧 Troubleshooting

### No notifications appearing?

1. **Verify graph type**
   - Check `Settings → About → Graph format`
   - Must be "Database (DB)" format
   - File-based graphs need the [Markdown version](https://github.com/Joemnewton/logseq-reminder-notifications)

2. **Check notification permissions**
   - **macOS**: System Settings → Notifications → Logseq (ensure enabled)
   - **Windows**: Settings → System → Notifications → Logseq (ensure enabled)
   - **Linux**: Check your desktop environment's notification settings

3. **Verify block format**
   - Use `scheduled:: YYYY-MM-DD HH:MM` format
   - Or journal format: `SCHEDULED: <YYYY-MM-DD Day HH:MM>`
   - Ensure time is within next 7 days

4. **Force a rescan**
   - Type `/reminders: rescan` in any block
   - Check Developer Console (`Cmd+Opt+I` or `Ctrl+Shift+I`) for debug output
   - Look for "Found X upcoming reminders" message

### Duplicate or late notifications?

1. **Check system clock**
   - Verify your OS clock and timezone are correct
   - Plugin uses local timezone

2. **Adjust polling interval**
   - Keep at 10-30 seconds for reliable timing
   - Longer intervals may cause delayed notifications

3. **Review quiet hours**
   - Check if quiet hours are enabled
   - Notifications are suppressed during quiet period

### Need help with Markdown graphs?

This plugin is designed specifically for **Database (DB)** graphs. For file-based/Markdown graphs, use the [Markdown-friendly version](https://github.com/Joemnewton/logseq-reminder-notifications).

---

## 🛠️ Development Notes

### Technical Details

- **Target Platform**: Logseq Desktop DB version (v1.3.x and later)
- **Database Queries**: Uses `:block/title` and `:logseq.property/scheduled`
- **Main Logic**: All code in `index.js` (single file, no bundler required)
- **Dependencies**: Zero runtime dependencies (uses Logseq Plugin API only)

### Architecture

The plugin scans your database for scheduled blocks using Datalog queries and maintains an in-memory list of upcoming reminders (next 7 days). It checks every 30 seconds (configurable) for due notifications and sends both desktop OS notifications and in-app Logseq banners.

### Contributing

Contributions and bug reports are welcome! Please:

1. Check existing [GitHub issues](https://github.com/Joemnewton/logseq-reminder-notifications-db/issues)
2. Create a new issue for bugs or feature requests
3. Submit pull requests with clear descriptions

---

## 📄 License

MIT © [Joemnewton](https://github.com/Joemnewton)

---

## 🔗 Links

- **GitHub Repository**: [logseq-reminder-notifications-db](https://github.com/Joemnewton/logseq-reminder-notifications-db)
- **Markdown Version**: [logseq-reminder-notifications](https://github.com/Joemnewton/logseq-reminder-notifications)
- **Issue Tracker**: [Report bugs or request features](https://github.com/Joemnewton/logseq-reminder-notifications-db/issues)

---

> **Need the Markdown build instead?** Use the [Markdown version of Reminder Notifications](https://github.com/Joemnewton/logseq-reminder-notifications).

---

*Made with ❤️ for the Logseq community*
