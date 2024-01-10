const config = require('config');
const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
const uri = config.get('mongodb.connectionString');

const client = new MongoClient(uri);
const database = client.db('webhook-server');

async function insertTokens(tokens) {
  const tokenCollection = database.collection('yahooFantasyTokens');
  return tokenCollection.insertOne({date: new Date(), ...tokens });
}

async function getLatestTokens() {
  const tokenCollection = database.collection('yahooFantasyTokens');
  const documents = await tokenCollection.find({}).sort({date: -1}).limit(1).toArray();
  return documents.pop();
}

async function insertReminder(type, reminder) {
  const reminderCollection = database.collection('reminders');
  return reminderCollection.insertOne({date: new Date(), active: true, type, reminder});
}

async function getReminders(filter) {
  const reminderCollection = database.collection('reminders');
  return reminderCollection.find(filter).sort({date: 1}).toArray();
}

async function markRemindersDone(filter) {
  const reminderCollection = database.collection('reminders');
  return await reminderCollection.updateMany({active: true, ...filter}, {active: false});
}

module.exports = {insertTokens, getLatestTokens, insertReminder, getReminders, markRemindersDone};
