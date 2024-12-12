import config from 'config';
import { MongoClient, ObjectId } from 'mongodb';

// Replace the uri string with your connection string.
const uri = config.get('mongodb.connectionString');

const client = new MongoClient(uri);
const database = client.db('webhook-server');

export async function insertTokens(tokens) {
  const tokenCollection = database.collection('yahooFantasyTokens');
  return tokenCollection.insertOne({ date: new Date(), ...tokens });
}

export async function getLatestTokens() {
  const tokenCollection = database.collection('yahooFantasyTokens');
  const documents = await tokenCollection
    .find({})
    .sort({ date: -1 })
    .limit(1)
    .toArray();
  return documents.pop();
}

export async function insertReminder(type, reminder) {
  const reminderCollection = database.collection('reminders');
  return reminderCollection.insertOne({
    date: new Date(),
    active: true,
    type,
    reminder,
  });
}

export async function getRemindersAsText(filter) {
  const reminderCollection = database.collection('reminders');
  const reminders = await reminderCollection
    .find({ active: true, ...filter })
    .sort({ date: 1 })
    .toArray();
  return reminders.map((r) => r.reminder.text).join('\n');
}

export async function markRemindersDone(filter) {
  const reminderCollection = database.collection('reminders');
  return await reminderCollection.updateMany(
    { active: true, ...filter },
    { $set: { active: false } }
  );
}

export class OOTPSim {
  public id?: ObjectId;
  public fileSize?: number;
  public error?: string;

  constructor(public date: Date) {}
}

export async function recordOOTPSim(sim: OOTPSim): Promise<OOTPSim> {
  const simCollection = database.collection('ootpSims');
  const val = await simCollection.insertOne(sim);
  sim.id = val.insertedId;
  return sim
}

export async function getLastOOTPSim(): Promise<OOTPSim|null> {
  const simCollection = database.collection<OOTPSim>('ootpSims');
  const sims = await simCollection
    .find({ error: { $exists: false } })
    .sort({ date: -1 })
    .limit(1)
    .toArray();
  if (!sims) {
    return null;
  }
  return sims[0];
}

export async function updateOOTPSim(sim: OOTPSim) {
  if (!sim.id) {
    return;
  }
  const simCollection = database.collection<OOTPSim>('ootpSims');
  const query = { _id: new ObjectId(sim.id) };
  await simCollection.updateOne(query, { $set: sim });
}
