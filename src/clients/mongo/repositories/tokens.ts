import { database } from '../connection.js';

interface YahooFantasyTokens {
  date: Date;
  [key: string]: unknown;
}

export async function insertTokens(
  tokens: Record<string, unknown>
): Promise<void> {
  const tokenCollection = database.collection('yahooFantasyTokens');
  await tokenCollection.insertOne({ date: new Date(), ...tokens });
}

export async function getLatestTokens(): Promise<YahooFantasyTokens | null> {
  const tokenCollection = database.collection('yahooFantasyTokens');
  const documents = await tokenCollection
    .find({})
    .sort({ date: -1 })
    .limit(1)
    .toArray();
  return documents.pop() || null;
}
