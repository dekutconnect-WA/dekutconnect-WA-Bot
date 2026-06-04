/**
 * webhook.js — HMAC-signed real-time webhooks gateway for DEKUTCONNECT
 * Sends secure events (e.g. connection status, auto-status replies) to third-party endpoints.
 */
'use strict';

const axios = require('axios');
const crypto = require('crypto');

const webhookUrl = process.env.WEBHOOK_URL || '';
const webhookSecret = process.env.WEBHOOK_SECRET || 'dekutconnect_hmac_secret_signature_key';

/**
 * Dispatch an HMAC-signed webhook event to the configured external webhook receiver
 * @param {string} eventType — Name/identifier of the event (e.g., 'bot.connection_status', 'bot.status_reply')
 * @param {object} payload   — Event payload JSON object
 * @returns {Promise<boolean>} True if sent successfully, false otherwise
 */
async function dispatchWebhook(eventType, payload) {
    if (!webhookUrl) {
        return false;
    }

    try {
        const payloadString = JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
            data: payload
        });
        
        // Compute HMAC signature for secure verification
        const signature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payloadString)
            .digest('hex');

        await axios.post(webhookUrl, payloadString, {
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Event': eventType,
                'X-Webhook-Signature': signature
            },
            timeout: 5000 // 5 seconds timeout to prevent hanging the main process
        });
        
        console.log(`✉️  [Webhook] Successfully dispatched event: ${eventType}`);
        return true;
    } catch (e) {
        console.warn(`⚠️  [Webhook] Dispatch failed for ${eventType}:`, e.message);
        return false;
    }
}

module.exports = { dispatchWebhook };
