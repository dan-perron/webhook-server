import config from 'config';
import { MongoClient } from 'mongodb';

// Replace the uri string with your connection string.
const uri = config.get('mongodb.connectionString');

const client = new MongoClient(uri);
const database = client.db('webhook-server');

export async function insertTokens(tokens) {
  const tokenCollection = database.collection('yahooFantasyTokens');
  return tokenCollection.insertOne({date: new Date(), ...tokens });
}

export async function getLatestTokens() {
  const tokenCollection = database.collection('yahooFantasyTokens');
  const documents = await tokenCollection.find({}).sort({date: -1}).limit(1).toArray();
  return documents.pop();
}

export async function insertReminder(type, reminder) {
  const reminderCollection = database.collection('reminders');
  return reminderCollection.insertOne({date: new Date(), active: true, type, reminder});
}

export async function getRemindersAsText(filter) {
  const reminderCollection = database.collection('reminders');
  let reminders = await reminderCollection.find(filter).sort({date: 1}).toArray();
  return reminders.map((r) => r.reminder.text).join('\n');
}

export async function markRemindersDone(filter) {
  const reminderCollection = database.collection('reminders');
  return await reminderCollection.updateMany({active: true, ...filter}, {$set: {active: false}});
}
