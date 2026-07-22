import express from 'express';
import request from 'supertest';

// ── Mocks ──

const mockOsintScanJobCreate = jest.fn();
const mockOsintScanJobFindById = jest.fn();
const mockOsintScanJobFind = jest.fn();
const mockOsintScanJobCountDocuments = jest.fn();
const mockOsintScanJobFindByIdAndUpdate = jest.fn();

const mockDarkWebLeakFind = jest.fn();
const mockDarkWebLeakFindOne = jest.fn();
const mockDarkWebLeakFindOneAndUpdate = jest.fn();
const mockDarkWebLeakCountDocuments = jest.fn();
const mockDarkWebLeakAggregate = jest.fn();

const mockBrandExposureFind = jest.fn();
const mockBrandExposureFindOne = jest.fn();
const mockBrandExposureFindOneAndUpdate = jest.fn();
const mockBrandExposureCountDocuments = jest.fn();

jest.mock('../models/OsintScanJob', () => ({
  OsintScanJob: {
    create: (...args: any[]) => mockOsintScanJobCreate(...args),
    findById: (...args: any[]) => mockOsintScanJobFindById(...args),
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockOsintScanJobFind(...args),
          }),
        }),
      }),
    }),
    countDocuments: (...args: any[]) => mockOsintScanJobCountDocuments(...args),
    findByIdAndUpdate: (...args: any[]) => mockOsintScanJobFindByIdAndUpdate(...args),
  },
}));

jest.mock('../models/DarkWebLeak', () => ({
  DarkWebLeak: {
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockDarkWebLeakFind(...args),
          }),
        }),
        limit: () => ({
          select: () => mockDarkWebLeakFind(...args),
        }),
      }),
    }),
    findOne: (...args: any[]) => mockDarkWebLeakFindOne(...args),
    findOneAndUpdate: (...args: any[]) => mockDarkWebLeakFindOneAndUpdate(...args),
    countDocuments: (...args: any[]) => mockDarkWebLeakCountDocuments(...args),
    aggregate: (...args: any[]) => mockDarkWebLeakAggregate(...args),
  },
}));

jest.mock('../models/BrandExposure', () => ({
  BrandExposure: {
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockBrandExposureFind(...args),
          }),
        }),
        limit: () => ({
          select: () => mockBrandExposureFind(...args),
        }),
      }),
    }),
    findOne: (...args: any[]) => mockBrandExposureFindOne(...args),
    findOneAndUpdate: (...args: any[]) => mockBrandExposureFindOneAndUpdate(...args),
    countDocuments: (...args: any[]) => mockBrandExposureCountDocuments(...args),
  },
}));

jest.mock('../queue', () => ({
  getQueue: () => ({
    add: jest.fn().mockResolvedValue({ id: 'bull-job-123' }),
  }),
  isRedisConnected: jest.fn().mockResolvedValue(false),
}));

jest.mock('../config', () => ({
  config: {
    port: 4004,
    nodeEnv: 'test',
    mongodbUri: 'mongodb://test:test@localhost:27017/test',
  },
}));

jest.mock('../config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ──

import osintRouter from '../routes/osint';

const app = express();
app.use(express.json());
app.use('/api/v1/osint', osintRouter);

describe('OSINT Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/osint/scan', () => {
    it('should start an OSINT scan for a valid target', async () => {
      mockOsintScanJobCreate.mockResolvedValue({
        _id: { toString: () => 'osint-job-123' },
        target: 'example.com',
        scanType: 'DOMAIN',
        status: 'QUEUED',
      });

      const res = await request(app)
        .post('/api/v1/osint/scan')
        .set('Authorization', 'Bearer test-token')
        .send({ target: 'example.com', scanType: 'DOMAIN' })
        .expect(202);

      expect(res.body.jobId).toBe('osint-job-123');
      expect(res.body.target).toBe('example.com');
      expect(res.body.status).toBe('QUEUED');
    });

    it('should return 400 for invalid scan type', async () => {
      const res = await request(app)
        .post('/api/v1/osint/scan')
        .set('Authorization', 'Bearer test-token')
        .send({ target: 'example.com', scanType: 'INVALID' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 400 for empty target', async () => {
      const res = await request(app)
        .post('/api/v1/osint/scan')
        .set('Authorization', 'Bearer test-token')
        .send({ target: '', scanType: 'DOMAIN' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('GET /api/v1/osint/scans', () => {
    it('should list OSINT scans with pagination', async () => {
      mockOsintScanJobCountDocuments.mockResolvedValue(1);
      mockOsintScanJobFind.mockResolvedValue([
        {
          _id: 'scan-1',
          target: 'example.com',
          scanType: 'DOMAIN',
          status: 'COMPLETED',
          progress: 100,
          leaksFound: 3,
          exposuresFound: 1,
          createdAt: new Date(),
          completedAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/osint/scans?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/v1/osint/leaks', () => {
    it('should list dark web leaks', async () => {
      mockDarkWebLeakCountDocuments.mockResolvedValue(2);
      mockDarkWebLeakFind.mockResolvedValue([
        {
          _id: 'leak-1',
          title: 'Credentials Dump',
          source: 'darkweb-forum',
          domain: 'example.com',
          leakType: 'CREDENTIALS',
          severity: 'CRITICAL',
          status: 'NEW',
          leakedCredentials: 1500,
          emailsInvolved: 500,
          discoveredAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/osint/leaks?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].severity).toBe('CRITICAL');
    });

    it('should filter leaks by severity', async () => {
      mockDarkWebLeakCountDocuments.mockResolvedValue(0);
      mockDarkWebLeakFind.mockResolvedValue([]);

      await request(app)
        .get('/api/v1/osint/leaks?severity=CRITICAL')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(mockDarkWebLeakCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'CRITICAL' }),
      );
    });
  });

  describe('GET /api/v1/osint/exposures', () => {
    it('should list brand exposures', async () => {
      mockBrandExposureCountDocuments.mockResolvedValue(1);
      mockBrandExposureFind.mockResolvedValue([
        {
          _id: 'exp-1',
          brandName: 'CyberFrost',
          domain: 'cyberfrost-secure.com',
          exposureType: 'TYPO_SQUATTING',
          severity: 'HIGH',
          status: 'NEW',
          url: 'http://cyberfrost-secure.com',
          discoveredAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/osint/exposures?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].exposureType).toBe('TYPO_SQUATTING');
    });

    it('should return empty list when no exposures exist', async () => {
      mockBrandExposureCountDocuments.mockResolvedValue(0);
      mockBrandExposureFind.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/osint/exposures')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });
  });

  describe('GET /api/v1/osint/dashboard', () => {
    it('should return OSINT dashboard statistics', async () => {
      mockDarkWebLeakCountDocuments
        .mockResolvedValueOnce(50)  // totalLeaks
        .mockResolvedValueOnce(10); // criticalLeaks
      mockBrandExposureCountDocuments
        .mockResolvedValueOnce(20)  // totalExposures
        .mockResolvedValueOnce(5);  // criticalExposures
      mockDarkWebLeakFind.mockResolvedValue([]);
      mockDarkWebLeakAggregate.mockResolvedValue([
        { _id: 'CRITICAL', count: 10 },
        { _id: 'HIGH', count: 15 },
        { _id: 'MEDIUM', count: 20 },
        { _id: 'LOW', count: 5 },
      ]);

      const res = await request(app)
        .get('/api/v1/osint/dashboard')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.totalLeaks).toBe(50);
      expect(res.body.criticalLeaks).toBe(10);
      expect(res.body.totalExposures).toBe(20);
      expect(res.body.severityBreakdown.CRITICAL).toBe(10);
    });
  });

  describe('PATCH /api/v1/osint/leaks/:id/status', () => {
    it('should update leak status', async () => {
      mockDarkWebLeakFindOneAndUpdate.mockResolvedValue({
        title: 'Credentials Dump',
        source: 'darkweb',
        severity: 'CRITICAL',
        status: 'VERIFIED',
      });

      const res = await request(app)
        .patch('/api/v1/osint/leaks/leak-1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'VERIFIED' })
        .expect(200);

      expect(res.body.message).toContain('VERIFIED');
    });

    it('should return 400 for invalid leak status', async () => {
      const res = await request(app)
        .patch('/api/v1/osint/leaks/leak-1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'INVALID' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('PATCH /api/v1/osint/exposures/:id/status', () => {
    it('should update exposure status', async () => {
      mockBrandExposureFindOneAndUpdate.mockResolvedValue({
        brandName: 'CyberFrost',
        domain: 'fake-cyberfrost.com',
        exposureType: 'TYPO_SQUATTING',
        severity: 'HIGH',
        status: 'INVESTIGATING',
      });

      const res = await request(app)
        .patch('/api/v1/osint/exposures/exp-1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'INVESTIGATING' })
        .expect(200);

      expect(res.body.message).toContain('INVESTIGATING');
    });
  });
});
