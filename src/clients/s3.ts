import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import config from 'config';
import * as fs from 'fs';

// Factory function to create a fresh S3 client
function createS3Client() {
  return new S3Client({
    region: config.get('aws.region'),
    credentials: {
      accessKeyId: config.get('aws.accessKey'),
      secretAccessKey: config.get('aws.secretAccessKey'),
    },
    maxAttempts: 3, // SDK-level retries
    requestTimeout: 30000, // 30 second timeout
  });
}

let s3Client = createS3Client();

export async function putFile(path, key?) {
  let stream: fs.ReadStream | null = null;
  try {
    stream = fs.createReadStream(path);

    // Put an object into an Amazon S3 bucket.
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.get('aws.bucket'),
        Key: key || path.split('/').pop(),
        Body: stream,
      })
    );
  } catch (error) {
    // Clean up stream on error
    if (stream) {
      stream.destroy();
    }

    // If we get a connection error, recreate the client for next time
    if (
      error instanceof Error &&
      (error.message.includes('Connection') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNRESET'))
    ) {
      console.log('S3 connection error detected, recreating client...');
      s3Client = createS3Client();
    }

    throw error;
  } finally {
    // Ensure stream is closed
    if (stream && !stream.destroyed) {
      stream.destroy();
    }
  }
}
