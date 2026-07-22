import express from 'express';
import request from 'supertest';

// ── Mocks ──

const mockAIInsightCreate = jest.fn();
const mockAIInsightCountDocuments = jest.fn();
const mockAIInsightFind = jest.fn();
const mockAIInsightFindOne = jest.fn();

jest.mock('../models/AIInsight', () => ({
  AIInsight: {
    create: (...args: any[]) => mockAIInsightCreate(...args),
    countDocuments: (...args: any[]) => mockAIInsightCountDocuments(...args),
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockAIInsightFind(...args),
          }),
        }),
        limit: () => ({
          select: () => mockAIInsightFind(...args),
        }),
      }),
      limit: () => ({
        select: () => mockAIInsightFind(...args),
      }),
    }),
    findOne: (...args: any[]) => mockAIInsightFindOne(...args),
  },
}));

jest.mock('../services/gemini', () => ({
  analyzeThreat: jest.fn().mockResolvedValue({
    summary: 'AI threat analysis summary',
    threat_level: 'HIGH',
    mitigation_steps: ['Patch immediately', 'Isolate affected systems'],
    confidence: 0.85,
  }),
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

jest.mock('../config', () => ({
  config: {
    port: 4007,
    nodeEnv: 'test',
    mongodbUri: 'mongodb://test:test@localhost:27017/test',
    gemini: {
      apiKey: 'test-api-key',
      model: 'gemini-2.0-flash',
    },
  },
}));

jest.mock('../config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ──

import aiRouter from '../routes/ai';

const app = express();
app.use(express.json());
app.use('/api/v1/ai', aiRouter);

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/ai/generate', () => {
    it('should generate an AI insight', async () => {
      mockAIInsightCreate.mockResolvedValue({
        _id: { toString: () => 'insight-123' },
        summary: 'AI-generated threat summary based on the provided intelligence data.',
        recommendations: ['Isolate affected systems immediately', 'Review IOCs and deploy blocking rules'],
      });

      const res = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'RCE Threat Analysis',
          insightType: 'THREAT_SUMMARY',
          sourceService: 'intelligence-service',
        })
        .expect(201);

      expect(res.body.message).toBe('AI insight generated');
      expect(res.body.id).toBe('insight-123');
      expect(res.body.recommendations).toHaveLength(2);
    });

    it('should generate different insight types', async () => {
      mockAIInsightCreate.mockResolvedValue({
        _id: { toString: () => 'insight-456' },
        summary: 'AI-generated attack scenario',
        recommendations: ['Review network segmentation'],
      });

      const res = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Ransomware Simulation',
          insightType: 'ATTACK_SCENARIO',
        })
        .expect(201);

      expect(res.body.message).toBe('AI insight generated');
    });

    it('should return 400 for invalid insight type', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Test',
          insightType: 'INVALID_TYPE',
        })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 400 for missing title', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', 'Bearer test-token')
        .send({
          insightType: 'THREAT_SUMMARY',
        })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('POST /api/v1/ai/summarize', () => {
    it('should summarize text', async () => {
      mockAIInsightCreate.mockResolvedValue({
        _id: { toString: () => 'sum-123' },
        summary: 'Suspicious network activity detected from IP 203.0.113.99.',
        insightType: 'THREAT_SUMMARY',
        sourceService: 'ai-service',
        sourceData: { originalLength: 250 },
      });

      const res = await request(app)
        .post('/api/v1/ai/summarize')
        .set('Authorization', 'Bearer test-token')
        .send({
          text: 'Suspicious network activity detected from IP 203.0.113.99 targeting multiple internal hosts on port 443. The activity pattern suggests a directory traversal attempt on several web servers. Source IP is associated with known malicious activity from threat intelligence feeds.',
          title: 'Alert Summary',
        })
        .expect(200);

      expect(res.body.summary).toBeDefined();
      expect(res.body.originalWords).toBeGreaterThan(0);
      expect(res.body.insightId).toBe('sum-123');
    });

    it('should return 400 for empty text', async () => {
      const res = await request(app)
        .post('/api/v1/ai/summarize')
        .set('Authorization', 'Bearer test-token')
        .send({ text: '' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should handle short text without truncation', async () => {
      mockAIInsightCreate.mockResolvedValue({
        _id: { toString: () => 'sum-456' },
        summary: 'Short text.',
      });

      const res = await request(app)
        .post('/api/v1/ai/summarize')
        .set('Authorization', 'Bearer test-token')
        .send({ text: 'Short text.' })
        .expect(200);

      expect(res.body.summary).toBe('Short text.');
    });
  });

  describe('GET /api/v1/ai/insights', () => {
    it('should list AI insights with pagination', async () => {
      mockAIInsightCountDocuments.mockResolvedValue(3);
      mockAIInsightFind.mockResolvedValue([
        {
          _id: 'insight-1',
          title: 'RCE Threat Analysis',
          summary: 'AI-generated summary',
          insightType: 'THREAT_SUMMARY',
          severity: 'HIGH',
          sourceService: 'intelligence-service',
          createdAt: new Date(),
        },
        {
          _id: 'insight-2',
          title: 'Ransomware Simulation',
          summary: 'Attack scenario analysis',
          insightType: 'ATTACK_SCENARIO',
          severity: 'MEDIUM',
          sourceService: 'ai-service',
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/ai/insights?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.data[0].insightType).toBe('THREAT_SUMMARY');
    });

    it('should filter by type', async () => {
      mockAIInsightCountDocuments.mockResolvedValue(0);
      mockAIInsightFind.mockResolvedValue([]);

      await request(app)
        .get('/api/v1/ai/insights?type=THREAT_SUMMARY')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(mockAIInsightCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ insightType: 'THREAT_SUMMARY' }),
      );
    });
  });

  describe('GET /api/v1/ai/insights/:id', () => {
    it('should return an insight detail', async () => {
      mockAIInsightFindOne.mockResolvedValue({
        toJSON: () => ({
          _id: 'insight-1',
          title: 'RCE Threat Analysis',
          summary: 'AI analysis summary',
          insightType: 'THREAT_SUMMARY',
          severity: 'HIGH',
          recommendations: ['Patch', 'Monitor'],
        }),
      });

      const res = await request(app)
        .get('/api/v1/ai/insights/insight-1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.title).toBe('RCE Threat Analysis');
    });

    it('should return 404 for non-existent insight', async () => {
      mockAIInsightFindOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/ai/insights/nonexistent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/ai/analyze-threat', () => {
    it('should analyze a threat using AI', async () => {
      mockAIInsightCreate.mockResolvedValue({
        _id: { toString: () => 'analysis-123' },
        summary: 'AI threat analysis summary',
        fullAnalysis: '{}',
        insightType: 'THREAT_SUMMARY',
        sourceService: 'ai-service',
        sourceData: {},
        recommendations: ['Patch immediately', 'Isolate affected systems'],
      });

      const res = await request(app)
        .post('/api/v1/ai/analyze-threat')
        .set('Authorization', 'Bearer test-token')
        .send({
          sourceType: 'VULNERABILITY',
          data: {
            cveId: 'CVE-2026-12345',
            cvssScore: 9.8,
            description: 'Remote code execution vulnerability',
          },
        })
        .expect(200);

      expect(res.body.summary).toBe('AI threat analysis summary');
      expect(res.body.threat_level).toBe('HIGH');
      expect(res.body.mitigation_steps).toHaveLength(2);
    });

    it('should return 400 for invalid source type', async () => {
      const res = await request(app)
        .post('/api/v1/ai/analyze-threat')
        .set('Authorization', 'Bearer test-token')
        .send({
          sourceType: 'INVALID_TYPE',
          data: {},
        })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('GET /api/v1/ai/omnibar', () => {
    it('should perform semantic search', async () => {
      mockAIInsightFind.mockResolvedValue([
        {
          _id: 'insight-1',
          title: 'Critical Vulnerability Analysis',
          summary: 'Analysis of critical RCE vulnerability',
          insightType: 'THREAT_SUMMARY',
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/ai/omnibar?q=critical%20vulnerability')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.query).toBe('critical vulnerability');
      expect(res.body.results.insights).toHaveLength(1);
    });

    it('should return 400 for empty search query', async () => {
      const res = await request(app)
        .get('/api/v1/ai/omnibar?q=')
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should search using regex pattern', async () => {
      mockAIInsightFind.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/ai/omnibar?q=ransomware')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.results.insights).toHaveLength(0);
    });
  });
});
