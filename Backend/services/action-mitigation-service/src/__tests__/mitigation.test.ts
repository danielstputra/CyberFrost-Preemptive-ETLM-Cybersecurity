import express from 'express';
import request from 'supertest';

// ── Mocks ──

const mockMitigationCountDocuments = jest.fn();
const mockMitigationFind = jest.fn();
const mockMitigationFindOne = jest.fn();
const mockMitigationFindOneAndUpdate = jest.fn();
const mockMitigationAggregate = jest.fn();

jest.mock('../models/MitigationAction', () => ({
  MitigationAction: {
    countDocuments: (...args: any[]) => mockMitigationCountDocuments(...args),
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockMitigationFind(...args),
          }),
        }),
      }),
    }),
    findOne: (...args: any[]) => mockMitigationFindOne(...args),
    findOneAndUpdate: (...args: any[]) => mockMitigationFindOneAndUpdate(...args),
    aggregate: (...args: any[]) => mockMitigationAggregate(...args),
  },
}));

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

jest.mock('../queue/connection', () => ({
  getQueue: () => ({
    add: jest.fn().mockResolvedValue({ id: 'mitigation-queue-job' }),
  }),
}));

jest.mock('../services/takedown-submitter', () => ({
  submitTakedownRequest: jest.fn().mockResolvedValue({
    gsb: { referenceId: 'gsb-ref-123', success: true },
    phishTank: { referenceId: 'pt-ref-123', success: true },
  }),
}));

jest.mock('../services/abuse-email', () => ({
  generateAbuseEmail: jest.fn().mockReturnValue('Generated abuse email template'),
  generateDomainAbuseEmail: jest.fn().mockReturnValue('Generated domain abuse email template'),
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

import mitigationRouter from '../routes/mitigation';
import takedownRouter from '../routes/takedown';

const app = express();
app.use(express.json());
app.use('/api/v1/action/mitigation', mitigationRouter);
app.use('/api/v1/action/takedown', takedownRouter);

describe('Action & Mitigation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mitigation - POST /api/v1/action/mitigation/block', () => {
    it('should queue a block action for a valid IP', async () => {
      const res = await request(app)
        .post('/api/v1/action/mitigation/block')
        .set('Authorization', 'Bearer test-token')
        .send({
          targetIp: '203.0.113.99',
          mitigationType: 'BLOCK_IP',
          description: 'Malicious IP',
          durationSeconds: 86400,
        })
        .expect(202);

      expect(res.body.message).toContain('Block action queued');
      expect(res.body.target).toBe('203.0.113.99');
    });

    it('should return 400 for missing targetIp and targetDomain', async () => {
      const res = await request(app)
        .post('/api/v1/action/mitigation/block')
        .set('Authorization', 'Bearer test-token')
        .send({ mitigationType: 'INVALID_TYPE' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 400 for invalid mitigation type', async () => {
      const res = await request(app)
        .post('/api/v1/action/mitigation/block')
        .set('Authorization', 'Bearer test-token')
        .send({ targetIp: '1.2.3.4', mitigationType: 'INVALID_TYPE' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('Mitigation - GET /api/v1/action/mitigation', () => {
    it('should list mitigation actions', async () => {
      mockMitigationCountDocuments.mockResolvedValue(1);
      mockMitigationFind.mockResolvedValue([
        {
          _id: 'mit-1',
          targetIp: '203.0.113.99',
          targetDomain: null,
          mitigationType: 'BLOCK_IP',
          firewallProvider: 'CLOUDFLARE',
          status: 'ACTIVE',
          ruleName: 'block-203-0-113-99',
          autoTriggered: false,
          createdAt: new Date(),
          expiresAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/action/mitigation?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].mitigationType).toBe('BLOCK_IP');
    });
  });

  describe('Mitigation - GET /api/v1/action/mitigation/stats/overview', () => {
    it('should return mitigation statistics', async () => {
      mockMitigationCountDocuments
        .mockResolvedValueOnce(50)  // total
        .mockResolvedValueOnce(15); // autoTriggered
      mockMitigationAggregate
        .mockResolvedValueOnce([
          { _id: 'ACTIVE', count: 30 },
          { _id: 'EXPIRED', count: 20 },
        ])
        .mockResolvedValueOnce([
          { _id: 'BLOCK_IP', count: 35 },
          { _id: 'BLOCK_DOMAIN', count: 15 },
        ]);

      const res = await request(app)
        .get('/api/v1/action/mitigation/stats/overview')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.total).toBe(50);
      expect(res.body.autoTriggered).toBe(15);
      expect(res.body.byStatus.ACTIVE).toBe(30);
      expect(res.body.byType.BLOCK_IP).toBe(35);
    });
  });

  describe('Mitigation - PATCH /api/v1/action/mitigation/:id/status', () => {
    it('should update mitigation status', async () => {
      mockMitigationFindOneAndUpdate.mockResolvedValue({
        targetIp: '203.0.113.99',
        targetDomain: null,
        mitigationType: 'BLOCK_IP',
        status: 'EXPIRED',
      });

      const res = await request(app)
        .patch('/api/v1/action/mitigation/mit-1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'EXPIRED' })
        .expect(200);

      expect(res.body.message).toContain('EXPIRED');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .patch('/api/v1/action/mitigation/mit-1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'INVALID' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('Mitigation - GET /api/v1/action/mitigation/:id', () => {
    it('should return mitigation detail', async () => {
      mockMitigationFindOne.mockResolvedValue({
        _id: 'mit-1',
        toJSON: () => ({
          targetIp: '203.0.113.99',
          mitigationType: 'BLOCK_IP',
          status: 'ACTIVE',
        }),
      });

      const res = await request(app)
        .get('/api/v1/action/mitigation/mit-1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.targetIp).toBe('203.0.113.99');
    });

    it('should return 404 for non-existent mitigation', async () => {
      mockMitigationFindOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/action/mitigation/nonexistent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(res.body.error).toBe('NOT_FOUND');
    });
  });
});
