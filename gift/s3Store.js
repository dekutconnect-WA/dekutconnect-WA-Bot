/**
 * s3Store.js — S3/MinIO cloud storage integration for DEKUTCONNECT
 * Offloads media storage from local disk to AWS S3, Cloudflare R2, or local MinIO.
 */
'use strict';

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs-extra');

let s3Client = null;
const bucketName = process.env.S3_BUCKET_NAME || '';

function getS3Client() {
    if (!s3Client && bucketName) {
        try {
            const config = {
                region: process.env.S3_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
                }
            };
            
            // Endpoint required for custom providers like MinIO, Cloudflare R2, DigitalOcean Spaces
            if (process.env.S3_ENDPOINT) {
                config.endpoint = process.env.S3_ENDPOINT;
                config.forcePathStyle = true; // Enables http://host/bucket path syntax for MinIO
            }
            
            s3Client = new S3Client(config);
            console.log('✅ S3/MinIO client initialized successfully');
        } catch (e) {
            console.warn('⚠️  S3 Storage client failed to initialize:', e.message);
            s3Client = null;
        }
    }
    return s3Client;
}

/**
 * Upload a local file to S3
 * @param {string} localPath — Absolute path to local file
 * @param {string} s3Key     — Target key path inside S3 bucket
 * @returns {Promise<string|null>} Target key path or null if upload is disabled/failed
 */
async function uploadFile(localPath, s3Key) {
    const client = getS3Client();
    if (!client) {
        return null;
    }
    try {
        if (!await fs.exists(localPath)) return null;
        const fileContent = await fs.readFile(localPath);
        
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: fileContent
        });
        
        await client.send(command);
        console.log(`☁️  [S3Store] Uploaded file to S3: ${s3Key}`);
        return s3Key;
    } catch (e) {
        console.error(`❌ [S3Store] Upload failed for ${localPath} -> ${s3Key}:`, e.message);
        return null;
    }
}

/**
 * Upload buffer directly to S3
 * @param {Buffer} buffer       — File buffer content
 * @param {string} s3Key        — Target key path inside S3 bucket
 * @param {string} contentType  — Mime content type
 * @returns {Promise<string|null>} Target key path or null if upload is disabled/failed
 */
async function uploadBuffer(buffer, s3Key, contentType = 'application/octet-stream') {
    const client = getS3Client();
    if (!client) return null;
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: buffer,
            ContentType: contentType
        });
        
        await client.send(command);
        console.log(`☁️  [S3Store] Uploaded buffer to S3: ${s3Key}`);
        return s3Key;
    } catch (e) {
        console.error(`❌ [S3Store] Buffer upload failed for ${s3Key}:`, e.message);
        return null;
    }
}

module.exports = {
    getS3Client,
    uploadFile,
    uploadBuffer
};
