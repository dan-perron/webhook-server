import { database } from '../connection.js';

export async function insertReminder(
  type: string,
  reminder: { text: string }
): Promise<void> {
  const reminderCollection = database.collection('reminders');
  await reminderCollection.insertOne({
    date: new Date(),
    active: true,
    type,
    reminder,
  });
}

export async function getRemindersAsText(
  filter: Record<string, unknown>
): Promise<string> {
  const reminderCollection = database.collection('reminders');
  const reminders = await reminderCollection
    .find({ active: true, ...filter })
    .sort({ date: 1 })
    .toArray();
  return reminders.map((r) => r.reminder.text).join('\n');
}

export async function markRemindersDone(
  filter: Record<string, unknown>
): Promise<void> {
  const reminderCollection = database.collection('reminders');
  await reminderCollection.updateMany(
    { active: true, ...filter },
    { $set: { active: false } }
  );
}
