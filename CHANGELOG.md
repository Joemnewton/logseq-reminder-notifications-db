# Changelog - DB Version

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
