import express from 'express';
import request from 'supertest';

// ── Mocks ──

const mockNotifCountDocuments = jest.fn();
const mockNotifFind = jest.fn();
const mockNotifFindOneAndUpdate = jest.fn();
const mockNotifUpdateMany = jest.fn();

jest.mock('../models/Notification', () => ({
  Notification: {
    countDocuments: (...args: any[]) => mockNotifCountDocuments(...args),
    find: (...args: any[]) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => mockNotifFind(...args),
          }),
        }),
      }),
    }),
    findOneAndUpdate: (...args: any[]) => mockNotifFindOneAndUpdate(...args),
    updateMany: (...args: any[]) => mockNotifUpdateMany(...args),
  },
}));

jest.mock('../queue/connection', () => ({
  getQueue: () => ({
    add: jest.fn().mockResolvedValue({ id: 'notif-queue-job' }),
  }),
}));

jest.mock('../config', () => ({
  config: {
    port: 4005,
    nodeEnv: 'test',
    mongodbUri: 'mongodb://test:test@localhost:27017/test',
  },
}));

jest.mock('../config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ──

import notifRouter from '../routes/notifications';

const app = express();
app.use(express.json());
app.use('/api/v1/notifications', notifRouter);

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/notifications', () => {
    it('should list notifications with pagination', async () => {
      mockNotifCountDocuments.mockResolvedValue(2);
      mockNotifFind.mockResolvedValue([
        {
          _id: 'notif-1',
          title: 'Critical Vulnerability Found',
          message: 'CVE-2026-12345 detected',
          type: 'CRITICAL',
          eventType: 'VULNERABILITY_FOUND',
          source: 'intelligence-service',
          read: false,
          createdAt: new Date(),
        },
        {
          _id: 'notif-2',
          title: 'Scan Completed',
          message: 'Domain scan finished',
          type: 'INFO',
          eventType: 'SCAN_COMPLETED',
          source: 'discovery-service',
          read: true,
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/notifications?page=1&limit=20')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.data[0].type).toBe('CRITICAL');
    });

    it('should filter by type', async () => {
      mockNotifCountDocuments.mockResolvedValue(0);
      mockNotifFind.mockResolvedValue([]);

      await request(app)
        .get('/api/v1/notifications?type=CRITICAL')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(mockNotifCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CRITICAL' }),
      );
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread notification counts', async () => {
      mockNotifCountDocuments
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(25)   // unread
        .mockResolvedValueOnce(5);   // critical unread

      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.total).toBe(100);
      expect(res.body.unread).toBe(25);
      expect(res.body.criticalUnread).toBe(5);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      mockNotifFindOneAndUpdate.mockResolvedValue({
        title: 'Test Notification',
        type: 'INFO',
        read: true,
        readAt: new Date(),
      });

      const res = await request(app)
        .patch('/api/v1/notifications/notif-1/read')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body.message).toBe('Marked as read');
    });

    it('should return 404 for non-existent notification', async () => {
      mockNotifFindOneAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/notifications/nonexistent/read')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      mockNotifUpdateMany.mockResolvedValue({ modifiedCount: 15 });

      const res = await request(app)
        .post('/api/v1/notifications/read-all')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(200);

      expect(res.body.message).toContain('15');
    });
  });

  describe('POST /api/v1/notifications/send-test', () => {
    it('should queue a test notification', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/send-test')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Test Alert',
          message: 'This is a test',
          severity: 'HIGH',
          eventType: 'THREAT_DETECTED',
        })
        .expect(202);

      expect(res.body.message).toContain('Test notification queued');
      expect(res.body.eventType).toBe('THREAT_DETECTED');
    });

    it('should use defaults when minimal data is provided', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/send-test')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(202);

      expect(res.body.message).toContain('Test notification queued');
    });
  });

  describe('Validation', () => {
    it('should return 400 for invalid event type', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/send-test')
        .set('Authorization', 'Bearer test-token')
        .send({ eventType: 'INVALID_EVENT' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 400 for invalid severity', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/send-test')
        .set('Authorization', 'Bearer test-token')
        .send({ severity: 'ULTRA_CRITICAL' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });
});
