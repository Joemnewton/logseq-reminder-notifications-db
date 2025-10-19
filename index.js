/**
 * Logseq Reminder Notifications Plugin (Database Version)
 * Provides desktop and in-app notifications for scheduled blocks
 *
 * NOTE: This version is for Logseq Database (DB) graphs only.
 * For Markdown/File-based graphs, use the Markdown version of this plugin.
 *
 * DB Version Key Changes:
 * - Uses :block/title instead of :block/content for block text
 * - Property queries use :logseq.property/scheduled for scheduled:: property
 * - SCHEDULED: <date> format in content still works and uses :block/title
 * - Scheduled property values may be returned as date numbers (milliseconds since epoch)
 */

/**
 * Constants
 */
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const PERIODIC_RESCAN_INTERVAL_MS = 2 * 60 * 1000;
const OVERDUE_NOTIFICATION_TIMEOUT_MS = 30000;
const NORMAL_NOTIFICATION_TIMEOUT_MS = 10000;
const CLEANUP_INTERVAL_MS = ONE_HOUR_MS; // Run cleanup every hour

/**
 * Time parsing utilities - inline for Logseq compatibility
 */

/**
 * Parse a Logseq timestamp like <2025-10-14 Tue 14:30> or property value "2025-10-14 14:30"
 * @param {string} text - The text to parse
 * @returns {Date|null} - Parsed date or null if invalid/no time
 */
function parseScheduledDateTime(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Pattern 1: Journal-style timestamp <2025-10-14 Tue 14:30>
  const journalMatch = text.match(/<(\d{4}-\d{2}-\d{2})\s+\w+\s+(\d{1,2}:\d{2})>/);
  if (journalMatch) {
    const [, datePart, timePart] = journalMatch;
    return parseDateTime(datePart, timePart);
  }

  // Pattern 2: Property value like "2025-10-14 14:30" or "2025-10-14T14:30"
  const propertyMatch = text.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}:\d{2})/);
  if (propertyMatch) {
    const [, datePart, timePart] = propertyMatch;
    return parseDateTime(datePart, timePart);
  }

  // Pattern 3: ISO-like format "2025-10-14T14:30:00"
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})T(\d{1,2}:\d{2}:\d{2})/);
  if (isoMatch) {
    const [, datePart, timePart] = isoMatch;
    return parseDateTime(datePart, timePart.substring(0, 5)); // Take only HH:MM
  }

  // No valid time pattern found
  return null;
}

/**
 * Helper to parse date and time parts into a Date object
 * @param {string} datePart - Date in YYYY-MM-DD format
 * @param {string} timePart - Time in HH:MM format
 * @returns {Date|null} - Parsed date or null if invalid
 */
function parseDateTime(datePart, timePart) {
  try {
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Validate ranges
    if (year < 1970 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    // Create date in local timezone
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Check if date is valid (handles invalid dates like Feb 30)
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (error) {
    console.warn('Failed to parse date/time:', datePart, timePart, error);
    return null;
  }
}

/**
 * Check if a date is within the next 7 days from now (including recent past for current day only)
 * @param {Date} date - The date to check
 * @returns {boolean} - True if within next 7 days
 */
function isWithinNext7Days(date) {
  if (!date || !(date instanceof Date)) {
    return false;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const sevenDaysFromNow = new Date(startOfToday.getTime() + SEVEN_DAYS_MS);

  // Allow a small tolerance (5 minutes) for "right now" notifications but block old past events
  const fiveMinutesAgo = new Date(now.getTime() - FIVE_MINUTES_MS);
  return date >= fiveMinutesAgo && date <= sevenDaysFromNow;
}

/**
 * Format a date for display in notifications
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDateTimeForNotification(date) {
  if (!date || !(date instanceof Date)) {
    return 'Invalid date';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (dateOnly.getTime() === today.getTime()) {
    return `Today at ${timeStr}`;
  }

  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return `Tomorrow at ${timeStr}`;
  }

  return date.toLocaleDateString() + ' at ' + timeStr;
}

/**
 * Generate a unique key for tracking notifications
 * @param {string} uuid - Block UUID
 * @param {Date} scheduledDate - The scheduled date
 * @param {number} intervalMinutes - Minutes before scheduled time
 * @returns {string} - Unique key for this notification
 */
function getNotificationKey(uuid, scheduledDate, intervalMinutes = 0) {
  if (!uuid || !scheduledDate) {
    return null;
  }

  // Include interval in key to allow multiple reminders for same block
  const dateStr = scheduledDate.toLocaleDateString();
  const timeStr = scheduledDate.toLocaleTimeString();
  return `${uuid}_${dateStr}_${timeStr}_${intervalMinutes}min`;
}

/**
 * Get reminder intervals from settings
 * @returns {number[]} - Array of reminder intervals in minutes
 */
function getReminderIntervals() {
  try {
    const settings = logseq.settings || {};
    const intervalsString = settings.defaultReminderIntervals || "0,5";

    // Parse comma-separated string (e.g., "0,5,15" or "0,5")
    const intervals = intervalsString
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 0);

    // Sort intervals in descending order (furthest out first)
    intervals.sort((a, b) => b - a);

    console.log('🔧 Using reminder intervals from settings:', intervals);
    return intervals;
  } catch (error) {
    console.error('❌ Error reading reminder intervals from settings:', error);
    // Fallback to default
    return [5, 0];
  }
}


/**
 * Check for all-day schedule format (date without time)
 * @param {string} text - The text to check
 * @returns {Date|null} - Date if all-day format found, null otherwise
 */
function checkForAllDaySchedule(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Pattern: <2025-10-14> or <2025-10-14 Mon> without time
  const allDayMatch = text.match(/<(\d{4}-\d{2}-\d{2})(?:\s+\w+)?>/);
  if (allDayMatch) {
    const [, datePart] = allDayMatch;
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Pattern: property value like "2025-10-14" without time
  const propertyMatch = text.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (propertyMatch) {
    const [, datePart] = propertyMatch;
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return null;
}

/**
 * Create all-day reminder time based on settings
 * @param {Date} date - The date for the all-day reminder
 * @returns {Date} - Date with configured all-day reminder time
 */
function createAllDayReminderTime(date) {
  if (!date) return null;

  try {
    const settings = logseq.settings || {};
    const timeString = settings.allDayReminderTime || "09:00";

    // Parse time string (e.g., "09:00" or "14:30")
    const [hoursStr, minutesStr] = timeString.split(':');
    const hours = parseInt(hoursStr) || 9;
    const minutes = parseInt(minutesStr) || 0;

    // Validate time values
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('⚠️ Invalid all-day reminder time in settings, using default 09:00');
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0);
    }

    console.log(`🔧 Using all-day reminder time from settings: ${timeString}`);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
  } catch (error) {
    console.error('❌ Error reading all-day reminder time from settings:', error);
    // Fallback to default 9 AM
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0);
  }
}

/**
 * Check if current time is at or past the scheduled time (considering lead time)
 * @param {Date} scheduledTime - When the reminder is scheduled for
 * @param {number} leadTimeMinutes - Minutes before scheduled time to notify
 * @returns {boolean} - True if it's time to notify
 */
function isTimeToNotify(scheduledTime, leadTimeMinutes = 0) {
  if (!scheduledTime || !(scheduledTime instanceof Date)) {
    return false;
  }

  const now = new Date();

  // Check quiet hours
  if (isInQuietHours(now)) {
    return false;
  }

  const notifyTime = new Date(scheduledTime.getTime() - (leadTimeMinutes * 60 * 1000));

  return now >= notifyTime;
}

/**
 * Check if current time is within quiet hours
 * @param {Date} now - Current time
 * @returns {boolean} - True if in quiet hours
 */
function isInQuietHours(now) {
  try {
    const settings = logseq.settings || {};

    // Check if quiet hours are enabled
    if (!settings.enableQuietHours) {
      return false;
    }

    const quietStart = settings.quietHoursStart || 22; // 10 PM default
    const quietEnd = settings.quietHoursEnd || 7;    // 7 AM default
    const currentHour = now.getHours();

    // Handle overnight quiet hours (e.g., 22 to 7)
    if (quietStart > quietEnd) {
      return currentHour >= quietStart || currentHour < quietEnd;
    }
    // Handle same-day quiet hours (e.g., 13 to 15)
    else {
      return currentHour >= quietStart && currentHour < quietEnd;
    }
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false; // Default to no quiet hours if error
  }
}

// Global state
let upcomingReminders = [];
let pollInterval = null;
let dailyRescanTimeout = null;
let cleanupInterval = null;
let alreadyNotified = {}; // Session-local tracking to prevent duplicates

/**
 * Main plugin initialization
 */
function main() {
  console.log('🔔 Reminder Notifications plugin v1.3.0 (DB Version) starting...');
  console.log('⚠️  COMPATIBILITY: This plugin ONLY works with Logseq DESKTOP DB version');
  console.log('⚠️  NOT compatible with: Mobile apps, Web version, or File-based graphs');
  console.log('🔧 Debug: Settings available:', Object.keys(logseq.settings || {}));
  console.log('🔧 Debug: Using session-only notification tracking');

  // Show compatibility warning to user
  logseq.App.showMsg(
    '⚠️ Reminder Notifications: Desktop DB version only. Not compatible with mobile or file-based graphs.',
    'warning',
    { timeout: 8000 }
  );

  // Define settings schema
  logseq.useSettingsSchema([
    {
      key: "defaultReminderIntervals",
      type: "string",
      title: "Default Reminder Intervals",
      description: "Set reminder intervals in minutes before scheduled time (comma-separated, e.g., '0,5,15')",
      default: "0,5"
    },
    {
      key: "enableAllDayReminders",
      type: "boolean",
      title: "Enable All-Day Reminders",
      description: "Send reminders for blocks scheduled for a day without specific time",
      default: false
    },
    {
      key: "allDayReminderTime",
      type: "string",
      title: "All-Day Reminder Time",
      description: "Time to send reminders for all-day scheduled blocks (24-hour format, e.g., 09:00)",
      default: "09:00"
    },
    {
      key: "pollIntervalSeconds",
      type: "number",
      title: "Polling Interval (seconds)",
      description: "How often to check for due reminders (10-300 seconds)",
      default: 30,
      min: 10,
      max: 300
    },
    {
      key: "dailyRescanHour",
      type: "number",
      title: "Daily Rescan Hour",
      description: "Hour of day to perform full rescan (0-23)",
      default: 3,
      min: 0,
      max: 23
    },
    {
      key: "enableQuietHours",
      type: "boolean",
      title: "Enable Quiet Hours",
      description: "Disable notifications during specified hours",
      default: false
    },
    {
      key: "quietHoursStart",
      type: "number",
      title: "Quiet Hours Start",
      description: "Hour to start quiet hours (0-23, e.g., 22 for 10 PM)",
      default: 22,
      min: 0,
      max: 23
    },
    {
      key: "quietHoursEnd",
      type: "number",
      title: "Quiet Hours End",
      description: "Hour to end quiet hours (0-23, e.g., 7 for 7 AM)",
      default: 7,
      min: 0,
      max: 23
    }
  ]);

  // Request notification permission early
  requestNotificationPermission();

  // Register slash command
  logseq.Editor.registerSlashCommand('reminders: rescan', async () => {
    console.log('📋 Manual rescan triggered via slash command');
    await scanForUpcomingReminders();
    logseq.App.showMsg('Reminders rescanned!', 'success');
  });

  // Register keyboard shortcut for quick rescan
  logseq.App.registerCommandPalette({
    key: 'rescan-reminders',
    label: 'Rescan for scheduled reminders',
    keybinding: {
      mode: 'global',
      binding: 'mod+shift+r'
    }
  }, async () => {
    console.log('📋 Manual rescan triggered via keyboard shortcut');
    await scanForUpcomingReminders();
    logseq.App.showMsg('Reminders rescanned!', 'success');
  });

  // Initial scan and setup - will be called when logseq.ready() fires
  console.log('📊 Logseq ready, starting initial scan...');
  scanForUpcomingReminders();
  setupPolling();
  scheduleDailyRescan();
  setupBlockChangeListeners();

  console.log('✅ Reminder Notifications plugin (DB Version) loaded');
}

/**
 * Request notification permission from the browser
 */
function requestNotificationPermission() {
  if (typeof Notification !== 'undefined') {
    console.log('🔔 Current notification permission:', Notification.permission);

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission after request:', permission);
      }).catch(error => {
        console.warn('⚠️ Could not request notification permission:', error);
      });
    }
  } else {
    console.warn('⚠️ Notification API not available in this browser');
  }
}

/**
 * Scan the Logseq database for scheduled blocks
 */
async function scanForUpcomingReminders() {
  try {
    console.log('🔍 Scanning for scheduled blocks (DB Version)...');

    // Clear current reminders
    upcomingReminders = [];

    // Query 1: Find blocks with SCHEDULED content (using :block/title for DB version)
    const scheduledContentBlocks = await findBlocksWithScheduledContent();
    console.log(`🔍 Found ${scheduledContentBlocks.length} blocks with SCHEDULED: content`);

    // Query 2: Find blocks with scheduled property (using :logseq.property/scheduled for DB version)
    const scheduledPropertyBlocks = await findBlocksWithScheduledProperty();
    console.log(`🔍 Found ${scheduledPropertyBlocks.length} blocks with scheduled:: property`);

    // Combine and process results
    const allBlocks = [...scheduledContentBlocks, ...scheduledPropertyBlocks];
    console.log(`🔍 Total blocks to process: ${allBlocks.length}`);

    for (const block of allBlocks) {
      console.log(`🔍 Processing block: "${block.content.substring(0, 80)}..."`);
      const reminderData = parseBlockForReminder(block);
      if (reminderData) {
        console.log(`  ✅ Parsed time: ${reminderData.when}`);
        if (isWithinNext7Days(reminderData.when)) {
          upcomingReminders.push(reminderData);
          console.log(`  ➕ Added to upcoming reminders`);
        } else {
          console.log(`  ❌ Not within next 7 days`);
        }
      } else {
        console.log(`  ❌ Could not parse time from this block`);
      }
    }

    // Remove duplicates by UUID
    const uniqueReminders = upcomingReminders.filter((reminder, index, arr) =>
      arr.findIndex(r => r.uuid === reminder.uuid) === index
    );
    upcomingReminders = uniqueReminders;

    console.log(`📅 Found ${upcomingReminders.length} upcoming reminders`);

    // Log upcoming reminders for debugging
    upcomingReminders.forEach(reminder => {
      const timeStr = formatDateTimeForNotification(reminder.when);
      const nowStr = new Date().toLocaleString();
      console.log(`  - ${reminder.page}: "${reminder.content.substring(0, 50)}..." at ${timeStr}`);
      console.log(`    UUID: ${reminder.uuid}, Current time: ${nowStr}`);
    });

  } catch (error) {
    console.error('❌ Error scanning for reminders:', error);
  }
}

/**
 * Find blocks containing SCHEDULED timestamps in content
 * DB VERSION: In DB version, SCHEDULED text may still appear in block/title
 * when using the old SCHEDULED: <date> format
 */
async function findBlocksWithScheduledContent() {
  try {
    const query = `
      [:find ?uuid ?title ?page-name
       :where
       [?b :block/uuid ?uuid]
       [?b :block/title ?title]
       [?b :block/page ?p]
       [?p :block/name ?page-name]
       [(clojure.string/includes? ?title "SCHEDULED:")]]`;

    const result = await logseq.DB.datascriptQuery(query);

    return result.map(([uuid, title, pageName]) => ({
      uuid: uuid,
      content: title,
      page: pageName,
      type: 'content'
    }));
  } catch (error) {
    console.error('❌ Error querying scheduled content blocks:', error);
    return [];
  }
}

/**
 * Find blocks with scheduled property
 * DB VERSION: Uses :logseq.property/scheduled for property-based scheduling
 */
async function findBlocksWithScheduledProperty() {
  try {
    // Try :logseq.property/scheduled (DB version property format)
    const query = `
      [:find ?uuid ?title ?page-name ?prop-value
       :where
       [?b :block/uuid ?uuid]
       [?b :block/title ?title]
       [?b :block/page ?p]
       [?p :block/name ?page-name]
       [?b :logseq.property/scheduled ?prop-value]]`;

    const result = await logseq.DB.datascriptQuery(query);

    return result.map(([uuid, title, pageName, propValue]) => ({
      uuid: uuid,
      content: title,
      page: pageName,
      scheduledProperty: propValue,
      type: 'property'
    }));
  } catch (error) {
    console.error('❌ Error querying scheduled property blocks:', error);
    return [];
  }
}

/**
 * Parse a block to extract reminder information
 */
function parseBlockForReminder(block) {
  try {
    let scheduledTime = null;
    let allDayDate = null;

    // Try to parse from content first (SCHEDULED: format)
    if (block.type === 'content') {
      scheduledTime = parseScheduledDateTime(block.content);

      // Check for all-day reminders if enabled in settings
      if (!scheduledTime) {
        const settings = logseq.settings || {};
        if (settings.enableAllDayReminders) {
          allDayDate = checkForAllDaySchedule(block.content);
        }
      }
    }

    // Try to parse from property if content parsing failed or this is a property block
    if (!scheduledTime && block.scheduledProperty) {
      // DB version: property value might be a number (date in milliseconds)
      if (typeof block.scheduledProperty === 'number') {
        scheduledTime = new Date(block.scheduledProperty);
        console.log(`📅 Parsed scheduled property as date number: ${scheduledTime}`);
      } else if (typeof block.scheduledProperty === 'string') {
        scheduledTime = parseScheduledDateTime(block.scheduledProperty);

        // Check for all-day reminders if enabled in settings
        if (!scheduledTime) {
          const settings = logseq.settings || {};
          if (settings.enableAllDayReminders) {
            allDayDate = checkForAllDaySchedule(block.scheduledProperty);
          }
        }
      } else {
        console.warn(`⚠️ Unexpected scheduled property type: ${typeof block.scheduledProperty}`, block.scheduledProperty);
      }
    }

    // Handle all-day reminders
    if (allDayDate) {
      scheduledTime = createAllDayReminderTime(allDayDate);
    }

    if (!scheduledTime) {
      return null; // No valid time found
    }

    // Get clean content for notification (remove SCHEDULED line and properties)
    let cleanContent = block.content
      .replace(/SCHEDULED:\s*<[^>]+>/g, '')  // Remove SCHEDULED timestamps
      .replace(/^\s*scheduled::\s*[^\n]+$/gm, '')  // Remove scheduled property lines
      .replace(/^\s*[\-\*]\s*/, '')  // Remove bullet points
      .trim();

    // If content is empty after cleanup, use a default message
    if (!cleanContent) {
      cleanContent = 'Scheduled reminder';
    }

    return {
      uuid: block.uuid,
      content: cleanContent,
      page: block.page,
      when: scheduledTime
    };
  } catch (error) {
    console.error('❌ Error parsing block for reminder:', block, error);
    return null;
  }
}

/**
 * Setup polling to check for due reminders and periodic rescanning
 */
function setupPolling() {
  // Clear existing intervals
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  if (window.periodicRescanInterval) {
    clearInterval(window.periodicRescanInterval);
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  const settings = logseq.settings || {};
  const intervalSeconds = settings.pollIntervalSeconds || 30;
  console.log(`⏱️ Setting up polling every ${intervalSeconds} seconds`);

  // Check for due reminders
  pollInterval = setInterval(async () => {
    await checkForDueReminders();
  }, intervalSeconds * 1000);

  // Periodic rescan every 2 minutes to catch new scheduled blocks
  window.periodicRescanInterval = setInterval(async () => {
    console.log('🔄 Periodic rescan (every 2 minutes)...');
    await scanForUpcomingReminders();
  }, PERIODIC_RESCAN_INTERVAL_MS);

  // Cleanup old notification records every hour
  cleanupInterval = setInterval(() => {
    cleanupOldNotificationRecords();
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Check if any reminders are due and send notifications
 */
async function checkForDueReminders() {
  const now = new Date();

  console.log(`⏰ Checking reminders at ${now.toLocaleTimeString()} - Found ${upcomingReminders.length} upcoming reminders`);

  if (upcomingReminders.length === 0) {
    console.log('🔍 No upcoming reminders found. Try running "/reminders: rescan" to refresh the list.');
  }

  let hasNewNotifications = false;

  for (const reminder of upcomingReminders) {
    // Handle multiple reminder intervals if enabled
    const reminderIntervals = getReminderIntervals();

    for (const intervalMinutes of reminderIntervals) {
      const isTimeForThis = isTimeToNotify(reminder.when, intervalMinutes);
      const notificationKey = getNotificationKey(reminder.uuid, reminder.when, intervalMinutes);
      const alreadySent = alreadyNotified[notificationKey];

      // Skip notifications for significantly past events (but allow small delays)
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - FIVE_MINUTES_MS);
      const isSignificantlyPast = reminder.when < fiveMinutesAgo;

      console.log(`  📋 "${reminder.content.substring(0, 30)}..." scheduled for ${formatDateTimeForNotification(reminder.when)}`);
      console.log(`     - Time to notify? ${isTimeForThis} (${intervalMinutes}min before)`);
      console.log(`     - Already notified? ${!!alreadySent}`);
      console.log(`     - Significantly past? ${isSignificantlyPast}`);
      console.log(`     - Notification key: ${notificationKey}`);

      if (isTimeForThis && !isSignificantlyPast) {
        if (notificationKey && !alreadySent) {
          // Send notification
          try {
            await sendNotification(reminder, intervalMinutes);

            // Mark as notified
            alreadyNotified[notificationKey] = new Date().toISOString();
            hasNewNotifications = true;

            console.log(`🔔 Notification sent for: ${reminder.content.substring(0, 50)}... (${intervalMinutes}min before)`);
          } catch (error) {
            console.error('❌ Error in sendNotification:', error);
          }
        } else {
          console.log(`⚠️ Skipping notification (already sent or invalid key)`);
        }
      }
    }
  }
}

/**
 * Send both desktop and Logseq notifications
 */
async function sendNotification(reminder, intervalMinutes = 0, isOverdue = false) {
  const timeStr = formatDateTimeForNotification(reminder.when);
  const customPrefix = '📅 Reminder'; // Fixed prefix for simplicity

  let title = `${customPrefix}: ${reminder.page}`;
  let message = reminder.content;

  // Customize message based on timing
  if (isOverdue) {
    title = `⏰ OVERDUE: ${reminder.page}`;
    message += `\n\n⚠️ This was scheduled for: ${timeStr}`;
  } else if (intervalMinutes > 0) {
    message += `\n\n🕐 Scheduled for: ${timeStr} (in ${intervalMinutes} minutes)`;
  } else {
    message += `\n\n🎯 Scheduled for: ${timeStr}`;
  }

  try {
    console.log('📢 Sending notifications...');

    // Logseq in-app notification
    console.log('📱 Sending Logseq in-app notification:', message);
    try {
      const notificationType = isOverdue ? 'warning' : 'info';
      await logseq.App.showMsg(message, notificationType, { timeout: 8000 });
      console.log('✅ Logseq notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Logseq notification:', error);
      // Fallback: try simpler call
      try {
        await logseq.App.showMsg(message);
        console.log('✅ Logseq notification sent with fallback method');
      } catch (fallbackError) {
        console.error('❌ Fallback notification also failed:', fallbackError);
      }
    }

    // Desktop notification
    console.log('🖥️ Checking desktop notification permission:', typeof Notification !== 'undefined' ? Notification.permission : 'API not available');

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      console.log('🖥️ Creating desktop notification');

      const notificationOptions = {
        body: message,
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTAuOSAyIDEwIDIuOSAxMCA0VjVINkM0LjkgNSA0IDUuOSA0IDdWMTdDNCAxOC4xIDQuOSAxOSA2IDE5SDE4QzE5LjEgMTkgMjAgMTguMSAyMCAxN1Y3QzIwIDUuOSAxOS4xIDUgMTggNUgxNFY0QzE0IDIuOSAxMy4xIDIgMTIgMlpNMTIgNEMxMi41IDQgMTMgNC40IDEzIDVIMTFDMTEgNC40IDExLjUgNCAxMiA0Wk0xOCA3VjE3SDZWN0gxOFpNMTIgMjBDMTMuMSAyMCAxNCAxOS4xIDE0IDE4SDEwQzEwIDE5LjEgMTAuOSAyMCAxMiAyMFoiIGZpbGw9IiNmNTk1MDAiLz4KPC9zdmc+',
        tag: `${reminder.uuid}_${intervalMinutes}`,
        requireInteraction: isOverdue, // Overdue notifications require interaction
        silent: false // Always allow notification sound
      };

      const notification = new Notification(title, notificationOptions);

      console.log('✅ Desktop notification created');

      // Auto-close notification (longer for overdue)
      const timeout = isOverdue ? OVERDUE_NOTIFICATION_TIMEOUT_MS : NORMAL_NOTIFICATION_TIMEOUT_MS;
      setTimeout(() => {
        notification.close();
      }, timeout);

    } else if (typeof Notification !== 'undefined') {
      console.warn('⚠️ Desktop notifications not permitted. Current permission:', Notification.permission);
    } else {
      console.warn('⚠️ Notification API not available');
    }

  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}

/**
 * Schedule daily rescan at configured hour
 */
function scheduleDailyRescan() {
  if (dailyRescanTimeout) {
    clearTimeout(dailyRescanTimeout);
  }

  const settings = logseq.settings || {};
  const rescanHour = settings.dailyRescanHour || 3;
  const now = new Date();
  const nextRescan = new Date();

  nextRescan.setHours(rescanHour, 0, 0, 0);

  // If the rescan time has already passed today, schedule for tomorrow
  if (nextRescan <= now) {
    nextRescan.setDate(nextRescan.getDate() + 1);
  }

  const msUntilRescan = nextRescan.getTime() - now.getTime();

  console.log(`🕐 Daily rescan scheduled for ${nextRescan.toLocaleString()}`);

  dailyRescanTimeout = setTimeout(async () => {
    console.log('🌅 Daily rescan triggered');
    await scanForUpcomingReminders();
    scheduleDailyRescan(); // Schedule next rescan
  }, msUntilRescan);
}

/**
 * Clean up old notification records to prevent memory bloat
 */
function cleanupOldNotificationRecords() {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - ONE_HOUR_MS);
    let removedCount = 0;

    // Remove entries for notifications older than 1 hour
    for (const [key, timestampStr] of Object.entries(alreadyNotified)) {
      const timestamp = new Date(timestampStr);
      if (timestamp < oneHourAgo) {
        delete alreadyNotified[key];
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old notification records from session`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up notification records:', error);
  }
}

/**
 * Handle settings changes
 */
logseq.onSettingsChanged((newSettings, oldSettings) => {
  console.log('⚙️ Settings changed');

  // Restart polling if interval changed
  if (newSettings.pollIntervalSeconds !== oldSettings.pollIntervalSeconds) {
    console.log('🔄 Restarting polling with new interval');
    setupPolling();
  }

  // Reschedule daily rescan if hour changed
  if (newSettings.dailyRescanHour !== oldSettings.dailyRescanHour) {
    console.log('🔄 Rescheduling daily rescan');
    scheduleDailyRescan();
  }

  // Rescan if reminder intervals changed
  if (newSettings.defaultReminderIntervals !== oldSettings.defaultReminderIntervals) {
    console.log('🔄 Reminder intervals changed, rescanning for reminders');
    scanForUpcomingReminders();
  }

  // Rescan if all-day reminder settings changed
  if (newSettings.enableAllDayReminders !== oldSettings.enableAllDayReminders ||
      newSettings.allDayReminderTime !== oldSettings.allDayReminderTime) {
    console.log('🔄 All-day reminder settings changed, rescanning for reminders');
    scanForUpcomingReminders();
  }

  // Log quiet hours changes (no action needed, applied on next notification check)
  if (newSettings.enableQuietHours !== oldSettings.enableQuietHours ||
      newSettings.quietHoursStart !== oldSettings.quietHoursStart ||
      newSettings.quietHoursEnd !== oldSettings.quietHoursEnd) {
    console.log('🔄 Quiet hours settings changed');
    if (newSettings.enableQuietHours) {
      console.log(`   Quiet hours: ${newSettings.quietHoursStart}:00 to ${newSettings.quietHoursEnd}:00`);
    } else {
      console.log('   Quiet hours disabled');
    }
  }
});

/**
 * Setup listeners for block changes to auto-detect new scheduled blocks
 */
function setupBlockChangeListeners() {
  console.log('👂 Setting up safe block change detection (periodic only)...');

  // DISABLED: Database listeners cause UI interference
  // Instead, we'll rely on periodic scanning and manual rescans

  console.log('✅ Using periodic scanning only to avoid UI issues');
}

/**
 * Cleanup on plugin unload
 */
logseq.beforeunload(() => {
  console.log('👋 Reminder Notifications plugin (DB Version) unloading...');

  if (pollInterval) {
    clearInterval(pollInterval);
  }

  if (window.periodicRescanInterval) {
    clearInterval(window.periodicRescanInterval);
  }

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  if (dailyRescanTimeout) {
    clearTimeout(dailyRescanTimeout);
  }

  // Clear any pending rescans
  if (window.scheduleRescanTimeout) {
    clearTimeout(window.scheduleRescanTimeout);
  }

  if (window.pageChangeRescanTimeout) {
    clearTimeout(window.pageChangeRescanTimeout);
  }
});

// Start the plugin
logseq.ready(main).catch(console.error);
