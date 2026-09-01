import { database } from '../connection.js';

export interface BlueskySession {
  identifier: string;
  did: string;
  accessJwt: string;
  refreshJwt: string;
  updatedAt: Date;
}

const collection = database.collection<BlueskySession>('blueskySessions');

export async function getStoredSession(
  identifier: string
): Promise<BlueskySession | null> {
  return collection.findOne({ identifier });
}

export async function storeSession(
  session: Omit<BlueskySession, 'updatedAt'>
): Promise<void> {
  await collection.updateOne(
    { identifier: session.identifier },
    { $set: { ...session, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function clearStoredSession(identifier: string): Promise<void> {
  await collection.deleteOne({ identifier });
}
