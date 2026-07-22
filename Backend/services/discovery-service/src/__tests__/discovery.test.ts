import express from 'express';
import request from 'supertest';

// ── Mocks ──

const mockScanJobCreate = jest.fn();
const mockScanJobFindById = jest.fn();
const mockScanJobFind = jest.fn();
const mockScanJobCountDocuments = jest.fn();
const mockScanJobFindByIdAndUpdate = jest.fn();

const mockDiscoveredDomainFind = jest.fn();
const mockDiscoveredDomainFindOne = jest.fn();
const mockDiscoveredDomainCountDocuments = jest.fn();
const mockDiscoveredDomainUpdateMany = jest.fn();

jest.mock('../models/ScanJob', () => ({
  ScanJob: {
    create: (...args: any[]) => mockScanJobCreate(...args),
    findById: (...args: any[]) => mockScanJobFindById(...args),
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockScanJobFind(...args),
          }),
        }),
      }),
    }),
    countDocuments: (...args: any[]) => mockScanJobCountDocuments(...args),
    findByIdAndUpdate: (...args: any[]) => mockScanJobFindByIdAndUpdate(...args),
  },
}));

jest.mock('../models/DiscoveredDomain', () => ({
  DiscoveredDomain: {
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockDiscoveredDomainFind(...args),
          }),
        }),
      }),
    }),
    findOne: (...args: any[]) => mockDiscoveredDomainFindOne(...args),
    countDocuments: (...args: any[]) => mockDiscoveredDomainCountDocuments(...args),
    updateMany: (...args: any[]) => mockDiscoveredDomainUpdateMany(...args),
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
    port: 4002,
    nodeEnv: 'test',
    mongodbUri: 'mongodb://test:test@localhost:27017/test',
  },
}));

jest.mock('../config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ──

import discoveryRouter from '../routes/discovery';

const app = express();
app.use(express.json());
app.use('/api/v1/discovery', discoveryRouter);

describe('Discovery Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/discovery/scan', () => {
    it('should queue a scan job for a valid domain', async () => {
      mockScanJobCreate.mockResolvedValue({
        _id: { toString: () => 'scan-job-123' },
        domain: 'example.com',
        status: 'QUEUED',
        progress: 0,
      });

      const res = await request(app)
        .post('/api/v1/discovery/scan')
        .set('Authorization', 'Bearer test-token')
        .send({ domain: 'example.com' })
        .expect(202);

      expect(res.body.jobId).toBe('scan-job-123');
      expect(res.body.domain).toBe('example.com');
    });

    it('should return 400 for invalid domain format', async () => {
      const res = await request(app)
        .post('/api/v1/discovery/scan')
        .set('Authorization', 'Bearer test-token')
        .send({ domain: 'not-a-valid-domain' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 400 for missing domain', async () => {
      const res = await request(app)
        .post('/api/v1/discovery/scan')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('GET /api/v1/discovery/scans', () => {
    it('should list scans with pagination', async () => {
      mockScanJobCountDocuments.mockResolvedValue(2);
      mockScanJobFind.mockResolvedValue([
        {
          _id: { toString: () => 'job-1' },
          domain: 'example.com',
          status: 'COMPLETED',
          progress: 100,
          subdomainsFound: 5,
          openPortsFound: 3,
          createdAt: new Date(),
          completedAt: new Date(),
        },
        {
          _id: { toString: () => 'job-2' },
          domain: 'test.com',
          status: 'QUEUED',
          progress: 0,
          subdomainsFound: 0,
          openPortsFound: 0,
          createdAt: new Date(),
          completedAt: null,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/discovery/scans?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.data[0].domain).toBe('example.com');
    });

    it('should return 400 for invalid pagination', async () => {
      const res = await request(app)
        .get('/api/v1/discovery/scans?page=-1')
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('GET /api/v1/discovery/domains', () => {
    it('should list discovered domains', async () => {
      mockDiscoveredDomainCountDocuments.mockResolvedValue(1);
      mockDiscoveredDomainFind.mockResolvedValue([
        {
          _id: { toString: () => 'domain-1' },
          domain: 'sub.example.com',
          parentDomain: 'example.com',
          ipAddress: '93.184.216.34',
          ports: [{ port: 80, service: 'http', isOpen: true }],
          technologies: [{ name: 'nginx', category: 'web-server' }],
          isActive: true,
          lastSeenAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/discovery/domains?page=1&limit=20')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].domain).toBe('sub.example.com');
    });

    it('should return empty list when no domains exist', async () => {
      mockDiscoveredDomainCountDocuments.mockResolvedValue(0);
      mockDiscoveredDomainFind.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/discovery/domains')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });
  });

  describe('GET /api/v1/discovery/scan/:jobId', () => {
    it('should return scan job details', async () => {
      mockScanJobFindById.mockResolvedValue({
        _id: { toString: () => 'job-1' },
        domain: 'example.com',
        status: 'COMPLETED',
        progress: 100,
        subdomainsFound: 10,
        openPortsFound: 5,
        startedAt: new Date(),
        completedAt: new Date(),
        error: null,
        resultSummary: { totalSubdomainsChecked: 100, resolvableSubdomains: 10, openPorts: 5, technologies: [] },
        createdAt: new Date(),
        tenantId: 'default',
      });

      const res = await request(app)
        .get('/api/v1/discovery/scan/job-1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.jobId).toBe('job-1');
      expect(res.body.status).toBe('COMPLETED');
    });

    it('should return 404 for non-existent job', async () => {
      mockScanJobFindById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/discovery/scan/nonexistent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(res.body.error).toBe('NOT_FOUND');
    });
  });
});
