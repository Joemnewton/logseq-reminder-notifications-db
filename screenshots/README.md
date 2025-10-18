# Screenshots Directory

This directory contains screenshots and demos for the Logseq Reminder Notifications plugin.

## Required Screenshots for Marketplace Submission

1. **desktop-notification.png** - Screenshot of desktop notification popup
2. **in-app-message.png** - Screenshot of in-app toast message in Logseq  
3. **console-output.png** - Screenshot of plugin debug output in browser console
4. **demo.gif** (optional) - Animated GIF showing plugin in action

## How to Take Screenshots

### Desktop Notification
1. Create a test block: `SCHEDULED: <2025-10-14 Mon 16:30> Test reminder`
2. Wait for the scheduled time
3. Screenshot the desktop notification when it appears
4. Save as `desktop-notification.png`

### In-App Message  
1. Same test block as above
2. Screenshot the toast message that appears in Logseq
3. Save as `in-app-message.png`

### Console Output
1. Open browser dev tools (F12) → Console tab
2. Run `/reminders: rescan` in Logseq
3. Screenshot the debug output showing block parsing
4. Save as `console-output.png`

### Demo GIF (Optional)
1. Use screen recording software (QuickTime on Mac, OBS, etc.)
2. Record creating a scheduled block and getting notifications
3. Convert to GIF using online tool or ffmpeg
4. Keep under 5MB for GitHub
5. Save as `demo.gif`

## Image Requirements

- **Format**: PNG for screenshots, GIF for animations
- **Size**: 600-800px wide recommended  
- **Quality**: High resolution, clear text
- **Content**: Show actual plugin functionality, not mockups

Once you have real screenshots, update the README.md file to replace the placeholder images with:

```markdown
![Desktop Notification](./screenshots/desktop-notification.png)
![In-App Message](./screenshots/in-app-message.png)  
![Demo](./screenshots/demo.gif)
```