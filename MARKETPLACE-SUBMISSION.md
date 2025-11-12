# Logseq Marketplace Submission Guide

## Prerequisites
- ✅ Plugin code hosted on GitHub (public repository)
- ✅ Repository: https://github.com/Joemnewton/logseq-reminder-notifications-db
- ✅ Plugin tested and working in Logseq DB version
- ✅ README.md with clear documentation
- ✅ LICENSE file (MIT)
- ✅ icon.svg for plugin branding

## Step 1: Fork the Logseq Marketplace Repository
- Go to https://github.com/logseq/marketplace
- Click the "Fork" button in the top-right corner
- This creates a copy under your account: `Joemnewton/marketplace`

## Step 2: Clone Your Fork Locally
```bash
git clone git@github.com:Joemnewton/marketplace.git
cd marketplace
```

## Step 3: Create a New Branch
```bash
git checkout -b add-reminder-notifications-db
```

## Step 4: Add Your Plugin to packages.json
- Open `packages.json` in the marketplace repository
- Find the appropriate location (alphabetically by plugin name)
- Add this entry:

```json
{
  "id": "logseq-reminder-notifications-db",
  "title": "Reminder Notifications",
  "description": "Desktop reminders for scheduled blocks in Logseq DB graphs",
  "author": "Joemnewton",
  "repo": "Joemnewton/logseq-reminder-notifications-db",
  "icon": "./icon.svg",
  "theme": false,
  "effect": false
}
```

**Important Notes:**
- The `id` must match the `id` in your `package.json`
- The `repo` should be in format: `username/repository-name`
- Add a comma after the previous entry if needed
- Ensure valid JSON formatting (use a JSON validator if unsure)

## Step 5: Commit Your Changes
```bash
git add packages.json
git commit -m "Add Reminder Notifications plugin

Desktop and in-app notifications for scheduled blocks in Logseq Database version.

Features:
- Desktop and in-app notifications
- Multiple reminder intervals
- All-day reminders support
- Quiet hours
- DB version compatibility
"
git push origin add-reminder-notifications-db
```

## Step 6: Create Pull Request
- Go to https://github.com/Joemnewton/marketplace
- You should see a banner suggesting you create a Pull Request
- Click "Compare & pull request"
- **Title**: `Add Reminder Notifications plugin`
- **Description**:
```markdown
# Reminder Notifications (DB Version)

Desktop and in-app notifications for scheduled blocks in Logseq Database version.

## Plugin Information
- **Repository**: https://github.com/Joemnewton/logseq-reminder-notifications-db
- **Version**: 1.3.0
- **License**: MIT
- **Logseq Compatibility**: Database (DB) version only

## Features
- Desktop notifications for scheduled blocks
- In-app toast messages
- Multiple reminder intervals (configurable)
- All-day reminders with configurable time
- Quiet hours support
- Manual rescan command and keyboard shortcut
- Supports both SCHEDULED: and scheduled:: formats

## Testing
- ✅ Tested on Logseq DB version
- ✅ Works with property-based scheduling (scheduled::)
- ✅ Works with inline scheduling (SCHEDULED: <date>)
- ✅ Desktop notifications working
- ✅ In-app notifications working

## Screenshots
See README: https://github.com/Joemnewton/logseq-reminder-notifications-db#screenshots
```

- Click "Create pull request"

## Step 7: Wait for Review
- The Logseq team will review your submission
- They may request changes or ask questions
- Respond to any feedback promptly
- Once approved, your plugin will appear in the marketplace!

## Step 8: After Approval
- Users can install your plugin directly from Logseq
- Path: Settings → Plugins → Marketplace → Search for "Reminder Notifications"
- Monitor GitHub issues for bug reports and feature requests
- Keep your plugin updated with Logseq changes

## Important Marketplace Guidelines
- **Plugin ID must be unique** - already verified: `logseq-reminder-notifications-db`
- **Repository must be public** - ✅ Done
- **Must include README with installation/usage instructions** - ✅ Done
- **Must include LICENSE file** - ✅ Done (MIT)
- **Must work with current Logseq version** - ✅ Tested with DB version
- **Icon should be SVG format** - ✅ `icon.svg` included

## Troubleshooting Common Issues
### JSON Validation Error
- Use https://jsonlint.com/ to validate `packages.json`
- Common issue: missing or extra commas

### Plugin Not Appearing After Installation
- Check plugin ID matches exactly in all files:
  - `manifest.json`: `"id": "logseq-reminder-notifications"`
  - `package.json`: `"logseq.id": "logseq-reminder-notifications-db"`
  - `packages.json` (marketplace): `"id": "logseq-reminder-notifications-db"`

### Review Taking Too Long
- Logseq maintainers review on a volunteer basis
- Be patient and polite
- You can politely ping after 7-10 days if no response

## Updating Your Plugin Later
When you release a new version:
- Update version in `package.json`
- Create a git tag: `git tag v1.4.0 && git push --tags`
- Create a GitHub Release with changelog
- Marketplace will automatically detect the new version
- No need to update `packages.json` again (unless changing metadata)

## Resources
- Logseq Marketplace: https://github.com/logseq/marketplace
- Plugin API Docs: https://plugins-doc.logseq.com/
- Community Forum: https://discuss.logseq.com/
- Discord: https://discord.gg/logseq

## Contact & Support
- GitHub Issues: https://github.com/Joemnewton/logseq-reminder-notifications-db/issues
- For marketplace submission questions: Comment on your PR
