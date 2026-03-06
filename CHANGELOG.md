# Changelog - DB Version

## v1.5.0 (Database Version) - 2026-03-06

### Code Quality & Robustness

- **Fixed global scope pollution**: Replaced `window.periodicRescanInterval` with a module-level variable, consistent with other timer references
- **Moved `onSettingsChanged` inside `main()`**: Ensures settings listener is registered after plugin initialization, preventing potential race conditions
- **Added query result validation**: `datascriptQuery` results are now checked for null/unexpected formats before processing, preventing crashes from malformed data
- **Added entity reference handling**: Scheduled property values that are entity references (objects with `:db/id`, e.g. journal page refs) are now handled gracefully instead of being silently ignored
- **Removed `navigator.userAgent` logging**: Eliminated unnecessary privacy-sensitive debug output
- **Removed dead code**: Cleaned up references to `window.scheduleRescanTimeout` and `window.pageChangeRescanTimeout` that were never set

## v1.4.0 (Database Version) - 2025-11-05

### Notification Duration Improvements

- Increased default in-app notification duration from 8s to 30s
- Increased default desktop notification duration from 10s to 30s
- Increased default overdue notification duration from 30s to 60s
- Added configurable notification duration settings (in-app, desktop, overdue)
- Added enhanced debugging for macOS notification issues
- Added event listeners to track notification lifecycle (onshow, onclick, onclose, onerror)

## v1.3.0 (Database Version) - 2025-10-18

### Initial DB Version Release

This is the Database (DB) version of the Logseq Reminder Notifications plugin, adapted to work with Logseq's new Database graphs.

#### DB-Specific Changes

- **Schema Updates:**
  - Updated queries to use `:block/title` instead of `:block/content`
  - Updated property queries to use `:logseq.property/scheduled` instead of `:block/scheduled`
  - Adapted data structure handling for DB-based graphs

- **Compatibility:**
  - Full compatibility with Logseq Database (DB) version
  - Works with graphs stored in `~/logseq/graphs/GRAPH-NAME/db.sqlite`
  - Optimized for DB version's property handling

#### Features (Inherited from v1.3.0)

- Settings GUI using `logseq.useSettingsSchema()`
- Configurable reminder intervals (comma-separated input)
- Optional all-day reminders with custom time
- Configurable polling interval and daily rescan hour
- Desktop notification with bell icon
- Quiet hours feature to disable notifications during sleep/work hours
- Persistent notification tracking to prevent duplicates
- Manual rescan command: `/reminders: rescan`
- Keyboard shortcut: `mod+shift+r` for quick rescan

#### Known Limitations

- Only compatible with Logseq Database (DB) graphs
- For Markdown/File-based graphs, use the Markdown version instead
- Same limitations as Markdown version regarding recurring reminders

#### Migration from Markdown Version

If you're migrating from the Markdown version to the DB version:

1. Ensure your Logseq graph is using Database version (not file-based)
2. Disable the Markdown version of this plugin
3. Install and enable the DB version
4. Run `/reminders: rescan` to populate reminders from your DB graph
5. Configure settings as needed (settings don't transfer between versions)

#### Technical Notes

The key differences in the DB version are:

1. **Query Changes:**
   ```clojure
   ;; Markdown Version:
   [?b :block/content ?content]
   [?b :block/properties ?props]
   [(get ?props :scheduled) ?prop-value]

   ;; DB Version:
   [?b :block/title ?title]
   [?b :logseq.property/scheduled ?prop-value]
   ```

2. **Data Structure:**
   - DB version uses SQLite database storage
   - Properties are stored as first-class entities
   - Schema is more structured than file-based version

3. **Property Access:**
   - Properties in DB version are accessed directly via schema attributes
   - No need to parse properties from content/YAML frontmatter
