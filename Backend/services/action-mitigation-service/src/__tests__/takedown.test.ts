import express from 'express';
import request from 'supertest';

// ── Mocks ──

const mockTakedownCountDocuments = jest.fn();
const mockTakedownFind = jest.fn();
const mockTakedownFindOne = jest.fn();
const mockTakedownFindOneAndUpdate = jest.fn();
const mockTakedownCreate = jest.fn();

jest.mock('../models/TakedownRequest', () => ({
  TakedownRequest: {
    countDocuments: (...args: any[]) => mockTakedownCountDocuments(...args),
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockTakedownFind(...args),
          }),
        }),
      }),
    }),
    findOne: (...args: any[]) => mockTakedownFindOne(...args),
    findOneAndUpdate: (...args: any[]) => mockTakedownFindOneAndUpdate(...args),
    create: (...args: any[]) => mockTakedownCreate(...args),
  },
}));

jest.mock('../services/takedown-submitter', () => ({
  submitTakedownRequest: jest.fn().mockResolvedValue({
    gsb: { referenceId: 'gsb-ref-123', success: true },
    phishTank: { referenceId: 'pt-ref-123', success: true },
  }),
}));

jest.mock('../services/abuse-email', () => ({
  generateAbuseEmail: jest.fn().mockReturnValue('Abuse report email template for hosting provider'),
  generateDomainAbuseEmail: jest.fn().mockReturnValue('Abuse report email template for domain registrar'),
}));

jest.mock('../config', () => ({
  config: {
    port: 4006,
    nodeEnv: 'test',
    mongodbUri: 'mongodb://test:test@localhost:27017/test',
  },
}));

jest.mock('../config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ──

import takedownRouter from '../routes/takedown';

const app = express();
app.use(express.json());
app.use('/api/v1/action/takedown', takedownRouter);

describe('Takedown Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/action/takedown', () => {
    it('should submit a takedown request successfully', async () => {
      mockTakedownCreate.mockResolvedValue({
        _id: { toString: () => 'td-123' },
        targetUrl: 'https://phishing-site.com/fake-login',
        domain: 'victim.com',
        threatType: 'PHISHING',
        platform: 'MANUAL',
        status: 'SUBMITTED',
        submittedTo: 'MANUAL',
        submittedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/action/takedown')
        .set('Authorization', 'Bearer test-token')
        .send({
          targetUrl: 'https://phishing-site.com/fake-login',
          domain: 'victim.com',
          threatType: 'PHISHING',
          evidence: 'Phishing page detected',
        })
        .expect(201);

      expect(res.body.message).toContain('Takedown request submitted');
      expect(res.body.id).toBe('td-123');
      expect(res.body.status).toBe('SUBMITTED');
    });

    it('should return 400 for invalid URL', async () => {
      const res = await request(app)
        .post('/api/v1/action/takedown')
        .set('Authorization', 'Bearer test-token')
        .send({
          targetUrl: 'not-a-url',
          domain: 'victim.com',
        })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 400 for invalid threat type', async () => {
      const res = await request(app)
        .post('/api/v1/action/takedown')
        .set('Authorization', 'Bearer test-token')
        .send({
          targetUrl: 'https://phishing-site.com',
          domain: 'victim.com',
          threatType: 'INVALID_TYPE',
        })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('GET /api/v1/action/takedown', () => {
    it('should list takedown requests with pagination', async () => {
      mockTakedownCountDocuments.mockResolvedValue(2);
      mockTakedownFind.mockResolvedValue([
        {
          _id: 'td-1',
          targetUrl: 'https://phishing-site.com',
          domain: 'victim.com',
          threatType: 'PHISHING',
          platform: 'MANUAL',
          status: 'SUBMITTED',
          submittedAt: new Date(),
          responseRef: 'ref-123',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/action/takedown?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].threatType).toBe('PHISHING');
    });

    it('should filter by status', async () => {
      mockTakedownCountDocuments.mockResolvedValue(0);
      mockTakedownFind.mockResolvedValue([]);

      await request(app)
        .get('/api/v1/action/takedown?status=SUBMITTED')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(mockTakedownCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SUBMITTED' }),
      );
    });
  });

  describe('PATCH /api/v1/action/takedown/:id/status', () => {
    it('should update takedown status', async () => {
      mockTakedownFindOneAndUpdate.mockResolvedValue({
        targetUrl: 'https://phishing-site.com',
        status: 'ACTIONED',
        notes: null,
      });

      const res = await request(app)
        .patch('/api/v1/action/takedown/td-1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'ACTIONED', notes: 'Provider confirmed' })
        .expect(200);

      expect(res.body.message).toContain('ACTIONED');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .patch('/api/v1/action/takedown/td-1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('POST /api/v1/action/takedown/generate-email', () => {
    it('should generate abuse email for hosting provider', async () => {
      const res = await request(app)
        .post('/api/v1/action/takedown/generate-email')
        .set('Authorization', 'Bearer test-token')
        .send({
          targetUrl: 'https://phishing-site.com',
          domain: 'victim.com',
          threatType: 'PHISHING',
          description: 'Phishing site targeting our client',
          emailType: 'HOSTING',
        })
        .expect(200);

      expect(res.body.email).toBeDefined();
    });

    it('should generate abuse email for domain registrar', async () => {
      const res = await request(app)
        .post('/api/v1/action/takedown/generate-email')
        .set('Authorization', 'Bearer test-token')
        .send({
          targetUrl: 'https://phishing-site.com',
          domain: 'victim.com',
          threatType: 'PHISHING',
          emailType: 'DOMAIN',
        })
        .expect(200);

      expect(res.body.email).toBeDefined();
    });

    it('should return 400 for invalid email type', async () => {
      const res = await request(app)
        .post('/api/v1/action/takedown/generate-email')
        .set('Authorization', 'Bearer test-token')
        .send({
          targetUrl: 'https://phishing-site.com',
          domain: 'victim.com',
          emailType: 'INVALID',
        })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('GET /api/v1/action/takedown/:id', () => {
    it('should return takedown detail', async () => {
      mockTakedownFindOne.mockResolvedValue({
        toJSON: () => ({
          targetUrl: 'https://phishing-site.com',
          domain: 'victim.com',
          threatType: 'PHISHING',
          status: 'SUBMITTED',
        }),
      });

      const res = await request(app)
        .get('/api/v1/action/takedown/td-1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.targetUrl).toBe('https://phishing-site.com');
    });

    it('should return 404 for non-existent takedown', async () => {
      mockTakedownFindOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/action/takedown/nonexistent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(res.body.error).toBe('NOT_FOUND');
    });
  });
});
