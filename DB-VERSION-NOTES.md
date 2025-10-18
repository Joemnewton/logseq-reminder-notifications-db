# Database Version - Technical Notes

This document explains the technical differences between the Markdown and DB versions of the Logseq Reminder Notifications plugin.

## Overview

Logseq offers two graph storage formats:

1. **Markdown/File-based**: Traditional format using markdown files and file system storage
2. **Database (DB)**: New format using SQLite database with structured schema

This is the **Database (DB) version** of the plugin.

## Schema Differences

### Block Content Attribute

**Markdown Version:**
```clojure
[?b :block/content ?content]
```

**DB Version:**
```clojure
[?b :block/title ?title]
```

The DB version uses `:block/title` instead of `:block/content` to access block text.

### Scheduled Property Attribute

**Markdown Version:**
```clojure
[?b :block/properties ?props]
[(get ?props :scheduled) ?prop-value]
```

**DB Version:**
```clojure
[?b :logseq.property/scheduled ?prop-value]
```

The DB version uses `:logseq.property/scheduled` as a first-class attribute instead of parsing properties from a map.

## Property Namespace Changes

In Logseq's DB version, task-related properties were moved to the `:logseq.property/` namespace:

- `:block/scheduled` → `:logseq.property/scheduled`
- `:block/deadline` → `:logseq.property/deadline`
- `:block/marker` → `:logseq.property/status`
- `:block/priority` → `:logseq.property/priority`

Our plugin uses `:logseq.property/scheduled` to query for scheduled blocks.

## Storage Format

**Markdown Version:**
- Stores data in `.md` files
- Located in graph directory as markdown files
- Properties in YAML frontmatter or inline format

**DB Version:**
- Stores data in SQLite database
- Located at `~/logseq/graphs/GRAPH-NAME/db.sqlite`
- Properties as first-class database entities
- More structured and queryable

## Query Examples

### Finding Scheduled Blocks (Content)

**Markdown Version:**
```clojure
[:find ?uuid ?content ?page-name
 :where
 [?b :block/uuid ?uuid]
 [?b :block/content ?content]
 [?b :block/page ?p]
 [?p :block/name ?page-name]
 [(clojure.string/includes? ?content "SCHEDULED:")]]
```

**DB Version:**
```clojure
[:find ?uuid ?title ?page-name
 :where
 [?b :block/uuid ?uuid]
 [?b :block/title ?title]
 [?b :block/page ?p]
 [?p :block/name ?page-name]
 [(clojure.string/includes? ?title "SCHEDULED:")]]
```

### Finding Scheduled Blocks (Property)

**Markdown Version:**
```clojure
[:find ?uuid ?content ?page-name ?prop-value
 :where
 [?b :block/uuid ?uuid]
 [?b :block/content ?content]
 [?b :block/page ?p]
 [?p :block/name ?page-name]
 [?b :block/properties ?props]
 [(get ?props :scheduled) ?prop-value]]
```

**DB Version:**
```clojure
[:find ?uuid ?title ?page-name ?prop-value
 :where
 [?b :block/uuid ?uuid]
 [?b :block/title ?title]
 [?b :block/page ?p]
 [?p :block/name ?page-name]
 [?b :logseq.property/scheduled ?prop-value]]
```

## Compatibility Notes

### When to Use DB Version

Use this DB version if:
- You're using Logseq's Database graphs
- Your graph is stored as a `.sqlite` file
- You see "DB" indicator in Logseq's UI
- Your graph directory contains `db.sqlite`

### When to Use Markdown Version

Use the Markdown version if:
- You're using traditional file-based graphs
- Your graph is a folder of `.md` files
- You see "Markdown" indicator in Logseq's UI
- Your graph directory contains `.md` files

### How to Check Your Graph Type

1. In Logseq, go to Settings
2. Look for your graph information
3. Check the graph type (DB or File-based/Markdown)

Or:

1. Navigate to your graph directory
2. If you see `db.sqlite` → DB version
3. If you see `.md` files → Markdown version

## Code Maintenance

Both versions share identical logic except for:

1. **Query strings** - Different attribute names
2. **Console messages** - Version identification
3. **Documentation** - Version-specific notes

All other functionality (notifications, parsing, settings, etc.) is identical.

## References

- [Logseq DB Version Documentation](https://github.com/logseq/docs/blob/master/db-version.md)
- [Logseq DB Version Changes](https://github.com/logseq/docs/blob/master/db-version-changes.md)
- [Logseq GitHub Repository](https://github.com/logseq/logseq)

## Future Considerations

As Logseq's DB version evolves, we may need to update:

- Query patterns for new schema changes
- Property namespaces if they change
- Database interaction patterns
- Performance optimizations specific to SQLite

Both versions will be maintained in parallel as long as Logseq supports both graph types.
