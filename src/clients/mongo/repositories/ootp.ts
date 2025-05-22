import { database } from '../connection.js';
import { OOTPSim } from '../types.js';

export async function recordOOTPSim(sim: OOTPSim): Promise<OOTPSim> {
  const simCollection = database.collection('ootpSims');
  const val = await simCollection.insertOne(sim);
  sim.id = val.insertedId;
  return sim;
}

export async function getLastOOTPSim(): Promise<OOTPSim | null> {
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
  const query = { _id: sim.id };
  await simCollection.updateOne(query, { $set: sim });
}
