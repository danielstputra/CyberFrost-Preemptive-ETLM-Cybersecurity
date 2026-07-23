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

import swaggerUi from 'swagger-ui-express';
import type swaggerJsdoc from 'swagger-jsdoc';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost';
const API_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

// Lazy init — swagger-jsdoc scan hanya ketika endpoint /docs dipanggil
// Biar server startup gak crash kalo ada file path yang beda di production
function buildSpec() {
  // Lazy require — tidak dijalankan saat startup
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerJsdoc: (...args: any[]) => any = require('swagger-jsdoc');

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
        `,
        contact: { email: 'support@cyberfrost.io' },
      },
      servers: [
        { url: `${API_URL}/api/v1`, description: 'API Gateway' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'Auth', description: 'Authentication & 2FA' },
        { name: 'Intelligence', description: 'Threat intelligence & CVEs' },
        { name: 'IOC', description: 'Indicators of Compromise' },
        { name: 'Takedown', description: 'Takedown requests' },
        { name: 'Health', description: 'Service health' },
      ],
    },
    apis: [
      '../services/auth-service/src/routes/*.ts',
      '../services/intelligence-service/src/routes/*.ts',
    ],
  };

  return swaggerJsdoc(options);
}

// Lazy initialization
let _spec: ReturnType<typeof buildSpec> | null = null;
function getSpec() {
  if (!_spec) _spec = buildSpec();
  return _spec;
}

export function getSwaggerSpec() {
  return getSpec();
}

export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui { background: #0B0F14; color: #e0e0e0 }
    .swagger-ui .info .title { color: #00f0ff }
  `,
  customSiteTitle: `${APP_NAME} API Docs`,
};
