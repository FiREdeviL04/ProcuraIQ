import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const REGION = process.env.AWS_REGION || 'us-east-1'
const BUCKET = process.env.AWS_S3_BUCKET || 'vendorbridge-exports'

const ENDPOINT = process.env.AWS_S3_ENDPOINT || undefined
const s3 = new S3Client({ region: REGION, endpoint: ENDPOINT, forcePathStyle: Boolean(ENDPOINT), credentials: process.env.AWS_ACCESS_KEY_ID ? {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
} : undefined })

export async function uploadBuffer(key: string, buffer: Buffer, contentType = 'application/octet-stream') {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }))
}

export async function getPresignedUrl(key: string, expiresIn = 60 * 60) {
  // generate presigned GET URL for download
  const { GetObjectCommand } = await import('@aws-sdk/client-s3')
  const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const url = await getSignedUrl(s3, getCmd, { expiresIn })
  return url
}
