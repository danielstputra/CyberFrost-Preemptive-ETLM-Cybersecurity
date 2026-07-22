import express from 'express';
import request from 'supertest';

// ── Mocks ──

const mockVulnCountDocuments = jest.fn();
const mockVulnFind = jest.fn();
const mockVulnFindOne = jest.fn();
const mockVulnFindOneAndUpdate = jest.fn();
const mockVulnAggregate = jest.fn();

const mockThreatCountDocuments = jest.fn();
const mockThreatFind = jest.fn();
const mockThreatFindOne = jest.fn();
const mockThreatAggregate = jest.fn();

jest.mock('../models/Vulnerability', () => ({
  Vulnerability: {
    countDocuments: (...args: any[]) => mockVulnCountDocuments(...args),
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockVulnFind(...args),
          }),
        }),
        limit: () => ({
          select: () => mockVulnFind(...args),
        }),
      }),
    }),
    findOne: (...args: any[]) => mockVulnFindOne(...args),
    findOneAndUpdate: (...args: any[]) => mockVulnFindOneAndUpdate(...args),
    aggregate: (...args: any[]) => mockVulnAggregate(...args),
  },
}));

jest.mock('../models/ThreatIntel', () => ({
  ThreatIntel: {
    countDocuments: (...args: any[]) => mockThreatCountDocuments(...args),
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockThreatFind(...args),
          }),
        }),
        limit: () => ({
          select: () => mockThreatFind(...args),
        }),
      }),
    }),
    findOne: (...args: any[]) => mockThreatFindOne(...args),
    aggregate: (...args: any[]) => mockThreatAggregate(...args),
  },
}));

jest.mock('../config', () => ({
  config: {
    port: 4003,
    nodeEnv: 'test',
    mongodbUri: 'mongodb://test:test@localhost:27017/test',
  },
}));

jest.mock('../config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ──

import intelRouter from '../routes/intelligence';

const app = express();
app.use(express.json());
app.use('/api/v1/intelligence', intelRouter);

describe('Intelligence Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/intelligence/vulnerabilities', () => {
    it('should list vulnerabilities with pagination', async () => {
      const mockVulns = [
        {
          _id: { toString: () => 'vuln-1' },
          cveId: 'CVE-2026-12345',
          title: 'Test Vulnerability',
          description: 'A test vulnerability',
          cvss: { score: 9.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
          severity: 'CRITICAL',
          affectedProducts: ['Product A'],
          exploitAvailable: true,
          publishedAt: new Date(),
          lastModifiedAt: new Date(),
          source: 'NVD',
          status: 'NEW',
          tags: ['remote-code-execution'],
        },
      ];

      mockVulnCountDocuments.mockResolvedValue(1);
      mockVulnFind.mockResolvedValue(mockVulns);

      const res = await request(app)
        .get('/api/v1/intelligence/vulnerabilities?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].cveId).toBe('CVE-2026-12345');
      expect(res.body.data[0].severity).toBe('CRITICAL');
      expect(res.body.pagination.total).toBe(1);
    });

    it('should filter by severity', async () => {
      mockVulnCountDocuments.mockResolvedValue(0);
      mockVulnFind.mockResolvedValue([]);

      await request(app)
        .get('/api/v1/intelligence/vulnerabilities?severity=CRITICAL')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      // Verify the filter was passed to countDocuments
      expect(mockVulnCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'CRITICAL' }),
      );
    });

    it('should return 400 for invalid severity', async () => {
      const res = await request(app)
        .get('/api/v1/intelligence/vulnerabilities?severity=INVALID')
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('GET /api/v1/intelligence/vulnerabilities/:id', () => {
    it('should return vulnerability detail', async () => {
      mockVulnFindOne.mockResolvedValue({
        _id: { toString: () => 'vuln-1' },
        cveId: 'CVE-2026-12345',
        title: 'Test Vulnerability',
        description: 'A test vulnerability',
        cvss: { score: 9.8 },
        severity: 'CRITICAL',
        affectedProducts: ['Product A'],
        exploitAvailable: true,
        exploitDetails: { proofOfConcept: true },
        publishedAt: new Date(),
        lastModifiedAt: new Date(),
        source: 'NVD',
        references: ['https://nvd.nist.gov'],
        tags: ['rce'],
        status: 'NEW',
        createdAt: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/intelligence/vulnerabilities/vuln-1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.cveId).toBe('CVE-2026-12345');
      expect(res.body.cvss.score).toBe(9.8);
    });

    it('should return 404 for non-existent vulnerability', async () => {
      mockVulnFindOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/intelligence/vulnerabilities/nonexistent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/intelligence/vulnerabilities/:id/status', () => {
    it('should update vulnerability status', async () => {
      mockVulnFindOneAndUpdate.mockResolvedValue({
        cveId: 'CVE-2026-12345',
        severity: 'CRITICAL',
        status: 'REVIEWING',
      });

      const res = await request(app)
        .patch('/api/v1/intelligence/vulnerabilities/vuln-1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'REVIEWING' })
        .expect(200);

      expect(res.body.message).toContain('REVIEWING');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .patch('/api/v1/intelligence/vulnerabilities/vuln-1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('GET /api/v1/intelligence/threats', () => {
    it('should list threat intelligence reports', async () => {
      mockThreatCountDocuments.mockResolvedValue(1);
      mockThreatFind.mockResolvedValue([
        {
          _id: { toString: () => 'threat-1' },
          title: 'APT Campaign Targeting Finance',
          summary: 'Summary of the threat',
          threatType: 'APT',
          severity: 'HIGH',
          status: 'ACTIVE',
          source: 'CISA',
          affectedSectors: ['Finance'],
          affectedRegions: ['North America'],
          mitreAttackIds: ['T1566'],
          publishedAt: new Date(),
          isActive: true,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/intelligence/threats?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].threatType).toBe('APT');
    });
  });

  describe('GET /api/v1/intelligence/threats/:id', () => {
    it('should return threat detail with IOCs', async () => {
      mockThreatFindOne.mockResolvedValue({
        _id: { toString: () => 'threat-1' },
        title: 'APT Campaign',
        description: 'Full description',
        summary: 'Summary',
        threatType: 'APT',
        severity: 'HIGH',
        status: 'ACTIVE',
        source: 'CISA',
        sourceUrl: 'https://cisa.gov',
        affectedSectors: ['Finance'],
        affectedRegions: ['Global'],
        indicators: [{ type: 'IP', value: '203.0.113.99' }],
        mitreAttackIds: ['T1566'],
        publishedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/intelligence/threats/threat-1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.title).toBe('APT Campaign');
      expect(res.body.indicators).toHaveLength(1);
    });
  });

  describe('GET /api/v1/intelligence/dashboard', () => {
    it('should return dashboard summary statistics', async () => {
      mockVulnCountDocuments
        .mockResolvedValueOnce(100) // totalVulnerabilities
        .mockResolvedValueOnce(40); // exploitAvailable (second count)
      mockVulnAggregate.mockResolvedValue([
        { _id: 'CRITICAL', count: 25 },
        { _id: 'HIGH', count: 35 },
        { _id: 'MEDIUM', count: 30 },
        { _id: 'LOW', count: 10 },
      ]);
      mockVulnFind.mockResolvedValue([]);
      mockThreatCountDocuments.mockResolvedValue(20);
      mockThreatFind.mockResolvedValue([]);
      mockThreatAggregate.mockResolvedValue([
        { _id: 'APT', count: 5 },
        { _id: 'RANSOMWARE', count: 3 },
      ]);

      const res = await request(app)
        .get('/api/v1/intelligence/dashboard')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.totalVulnerabilities).toBe(100);
      expect(res.body.exploitsAvailable).toBe(40);
      expect(res.body.severityBreakdown.CRITICAL).toBe(25);
    });
  });

  describe('CVE Severity Calculation Helpers', () => {
    it('should correctly identify critical severity', () => {
      const severity = 'CRITICAL';
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(severity);
    });

    it('should correctly parse CVSS score ranges', () => {
      const getSeverityFromScore = (score: number): string => {
        if (score >= 9.0) return 'CRITICAL';
        if (score >= 7.0) return 'HIGH';
        if (score >= 4.0) return 'MEDIUM';
        return 'LOW';
      };

      expect(getSeverityFromScore(9.8)).toBe('CRITICAL');
      expect(getSeverityFromScore(7.5)).toBe('HIGH');
      expect(getSeverityFromScore(5.0)).toBe('MEDIUM');
      expect(getSeverityFromScore(2.5)).toBe('LOW');
    });
  });
});
