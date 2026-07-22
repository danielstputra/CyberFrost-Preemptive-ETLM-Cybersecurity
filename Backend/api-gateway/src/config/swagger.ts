/**
 * Swagger / OpenAPI Configuration
 * ================================
 * Auto-generates API documentation from JSDoc comments.
 * Access: GET /api/v1/docs
 *
 * Setup:
 *   1. Add JSDoc annotation with @openapi above each route
 *   2. Swagger UI reads and renders the docs live
 *
 * @see https://swagger.io/specification/
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost';
const API_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: `${APP_NAME} API`,
      version: '1.0.0',
      description: `
        CyberFrost Security Platform — Enterprise API.

        Base URL: ${API_URL}/api/v1

        ### Authentication
        Most endpoints require a JWT access token.
        Use the \`Authorize\` button and paste your token: \`Bearer <token>\`

        ### 2FA
        Users with 2FA enabled must complete the 2FA flow after login.
      `,
      contact: {
        email: 'support@cyberfrost.io',
      },
    },
    servers: [
      { url: `${API_URL}/api/v1`, description: 'API Gateway' },
      { url: 'http://localhost:4001/api/v1', description: 'Auth Service (dev)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT access token here',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication, registration, token refresh' },
      { name: '2FA', description: 'Two-factor authentication (TOTP)' },
      { name: 'Takedown', description: 'Takedown request management' },
      { name: 'Mitigation', description: 'Mitigation actions (block IP/domain)' },
      { name: 'Discovery', description: 'Attack surface discovery' },
      { name: 'Intelligence', description: 'Threat intelligence & CVEs' },
      { name: 'OSINT', description: 'Dark web monitoring & brand protection' },
      { name: 'Notifications', description: 'Real-time alerts & notifications' },
      { name: 'AI', description: 'AI-generated insights & summaries' },
      { name: 'Reports', description: 'PDF report generation' },
      { name: 'Health', description: 'Service health checks' },
    ],
  },
  // Scan all service route files for JSDoc annotations
  apis: [
    '../services/auth-service/src/routes/*.ts',
    '../services/action-mitigation-service/src/routes/*.ts',
    '../services/discovery-service/src/routes/*.ts',
    '../services/intelligence-service/src/routes/*.ts',
    '../services/osint-service/src/routes/*.ts',
    '../services/notification-service/src/routes/*.ts',
    '../services/ai-service/src/routes/*.ts',
    '../services/report-service/src/routes/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui { background: #0B0F14; color: #e0e0e0 }
    .swagger-ui .info .title { color: #00f0ff }
    .swagger-ui .opblock-tag { color: #00f0ff }
    .swagger-ui .opblock .opblock-summary-operation-id { color: #6F7C89 }
    .swagger-ui .opblock-summary-path { color: #e0e0e0 }
    .swagger-ui .opblock-summary-description { color: #6F7C89 }
    .swagger-ui .response-col_status { color: #FF003C }
    .swagger-ui .btn.authorize { background: #00f0ff; color: #000 }
    .swagger-ui input { background: #1a1a2e; color: #e0e0e0; border-color: #333 }
  `,
  customSiteTitle: `${APP_NAME} API Docs`,
};
