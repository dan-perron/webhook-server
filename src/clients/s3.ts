import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

import config from 'config';
import * as fs from 'fs';

const s3Client = new S3Client({
  region: config.get('aws.region'),
  credentials: {
    accessKeyId: config.get('aws.accessKey'),
    secretAccessKey: config.get('aws.secretAccessKey'),
  },
});

export async function putFile(path, key?) {
  // Put an object into an Amazon S3 bucket.
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.get('aws.bucket'),
      Key: key || path.split('/').pop(),
      Body: fs.createReadStream(path),
    }),
  );
}
