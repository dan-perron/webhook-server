import config from 'config';
import { MongoClient } from 'mongodb';

const uri = config.get('mongodb.connectionString');
const client = new MongoClient(uri);
const database = client.db('webhook-server');

export { client, database };
