/**
 * swagger.js — Swagger interactive API documentation for DEKUTCONNECT
 * Configures swagger-jsdoc and swagger-ui-express to serve documentation on /api-docs
 */
'use strict';

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DEKUTCONNECT WA-Bot Console API',
            version: '5.0.0',
            description: 'Interactive developer API documentation for managing Multi-Instance WhatsApp Bots, session pairings, real-time syncs, and backend triggers.',
            contact: {
                name: 'DEKUTCONNECT Admin Support',
                url: 'https://rizzrok.com/@dekutconnect'
            }
        },
        servers: [
            {
                url: 'http://localhost:50900',
                description: 'Local Session Console Server'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your Firebase Client Auth ID Token.'
                }
            }
        }
    },
    apis: [__filename] // Scans JSDoc comments directly inside this file for documentation
};

const swaggerSpec = swaggerJSDoc(options);

// JSDoc definitions for routes:

/**
 * @swagger
 * /api/firebase-config:
 *   get:
 *     summary: Retrieve Firebase client config
 *     description: Returns the active Firebase JS SDK configuration client parameters.
 *     responses:
 *       200:
 *         description: Config retrieved successfully
 */

/**
 * @swagger
 * /api/bot/status:
 *   get:
 *     summary: Check WhatsApp bot status
 *     description: Retrieves the connection status and paired phone number for the user's bot.
 *     parameters:
 *       - in: query
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase unique user identifier (UID)
 *     responses:
 *       200:
 *         description: Status payload
 */

/**
 * @swagger
 * /api/bot/start:
 *   post:
 *     summary: Start bot instance
 *     description: Spawns the connection worker child process for the authenticated user session.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bot started successfully
 *       401:
 *         description: Unauthorized session
 */

/**
 * @swagger
 * /api/bot/stop:
 *   post:
 *     summary: Stop bot instance
 *     description: Gracefully stops the active bot connection process.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bot stopped successfully
 */

/**
 * @swagger
 * /api/bot/delete:
 *   post:
 *     summary: Delete bot session
 *     description: Disconnects the WhatsApp worker and removes all credential keys.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bot session deleted
 */

module.exports = {
    swaggerUi,
    swaggerSpec
};
