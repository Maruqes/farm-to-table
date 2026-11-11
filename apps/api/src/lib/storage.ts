import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from '../config/env.js'

type Client = { send(cmd: unknown): Promise<any> }

let client: Client | null = null

export function setStorageClientForTests(c: Client | null): void {
  client = c
}

function s3(): Client {
  client ??= new S3Client({
    region: 'us-east-1',
    endpoint: env.s3.endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: env.s3.accessKey, secretAccessKey: env.s3.secretKey },
  })
  return client
}

const Bucket = () => env.s3.bucket

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await s3().send(new PutObjectCommand({ Bucket: Bucket(), Key: key, Body: body, ContentType: contentType }))
}

export async function getObject(key: string): Promise<{ body: Buffer, contentType: string } | null> {
  try {
    const out = await s3().send(new GetObjectCommand({ Bucket: Bucket(), Key: key }))
    return { body: Buffer.from(await out.Body.transformToByteArray()), contentType: out.ContentType ?? 'application/octet-stream' }
  } catch (e) {
    if ((e as { name?: string }).name === 'NoSuchKey') return null
    throw e
  }
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: Bucket(), Key: key }))
}

export async function ping(): Promise<boolean> {
  try {
    await s3().send(new HeadBucketCommand({ Bucket: Bucket() }))
    return true
  } catch {
    return false
  }
}
