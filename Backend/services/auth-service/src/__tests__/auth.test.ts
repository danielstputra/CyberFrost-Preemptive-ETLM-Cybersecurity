import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ── Mocks ──

const mockFindUnique = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockTransaction = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
    },
    tenant: {
      create: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
    },
    $transaction: (fn: any) => mockTransaction(fn),
  })),
}));

jest.mock('../config', () => ({
  config: {
    port: 4001,
    nodeEnv: 'test',
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    jwt: {
      secret: 'test-secret-key-for-testing',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
    bcrypt: {
      saltRounds: 10,
    },
  },
}));

jest.mock('../config/database', () => ({
  getPrisma: () => ({
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
    },
    $transaction: (fn: any) => mockTransaction(fn),
  }),
}));

// ── Import after mocks ──

import authRouter from '../routes/auth';
import { authenticate, requireRole } from '../middleware/auth';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    const validPayload = {
      email: 'admin@test.com',
      password: 'Test1234!',
      name: 'Admin User',
      tenantName: 'Test Corp',
      tenantSlug: 'test-corp',
    };

    it('should register a new tenant and user successfully', async () => {
      mockFindUnique.mockResolvedValue(null); // no duplicate email
      mockTransaction.mockImplementation(async (fn: any) => {
        const tx = {
          tenant: {
            create: jest.fn().mockResolvedValue({
              id: 'tenant-123',
              name: 'Test Corp',
              slug: 'test-corp',
            }),
          },
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-123',
              email: 'admin@test.com',
              name: 'Admin User',
              role: 'ADMIN',
              tenantId: 'tenant-123',
              createdAt: new Date(),
            }),
          },
        };
        return fn(tx);
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validPayload)
        .expect(201);

      expect(res.body.message).toBe('Registration successful.');
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('admin@test.com');
      expect(res.body.tenant.name).toBe('Test Corp');
    });

    it('should return 409 if email is already registered', async () => {
      mockFindUnique.mockResolvedValue({ id: 'existing-user', email: 'admin@test.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validPayload)
        .expect(409);

      expect(res.body.error).toBe('CONFLICT');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload, email: 'not-an-email' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload, password: '123' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 400 for invalid tenant slug', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload, tenantSlug: 'INVALID SLUG!' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 400 if name is empty', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload, name: '' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@test.com',
      name: 'Admin User',
      passwordHash: '',
      role: 'ADMIN',
      tenantId: 'tenant-123',
      isActive: true,
      lastLoginAt: null,
      refreshTokenHash: null,
      tenant: {
        id: 'tenant-123',
        name: 'Test Corp',
        slug: 'test-corp',
        isActive: true,
      },
    };

    beforeEach(() => {
      mockUser.passwordHash = bcrypt.hashSync('Test1234!', 10);
    });

    it('should login successfully and return tokens', async () => {
      mockFindUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'Test1234!' })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('admin@test.com');
    });

    it('should return 401 for wrong password', async () => {
      mockFindUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'WrongPass1!' })
        .expect(401);

      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('should return 401 for inactive user', async () => {
      mockFindUnique.mockResolvedValue({ ...mockUser, isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'Test1234!' })
        .expect(401);

      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'Test1234!' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 400 if refreshToken is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(res.body.error).toBe('INVALID_TOKEN');
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'ADMIN' },
        'test-secret-key-for-testing',
        { expiresIn: '0s' },
      );
      // Wait for expiration
      await new Promise((r) => setTimeout(r, 100));

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(res.body.error).toBe('TOKEN_EXPIRED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('should return user profile with valid token', async () => {
      const token = jwt.sign(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'ADMIN' },
        'test-secret-key-for-testing',
      );

      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        avatarUrl: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: { id: 'tenant-123', name: 'Test Corp', slug: 'test-corp', logoUrl: null },
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.user.email).toBe('admin@test.com');
    });

    it('should return 404 for non-existent user', async () => {
      const token = jwt.sign(
        { userId: 'nonexistent', tenantId: 'tenant-123', role: 'ADMIN' },
        'test-secret-key-for-testing',
      );

      mockFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/auth/me', () => {
    it('should update user profile', async () => {
      const token = jwt.sign(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'ADMIN' },
        'test-secret-key-for-testing',
      );

      mockFindUnique.mockResolvedValueOnce(null); // no email conflict
      mockUpdate.mockResolvedValue({
        id: 'user-123',
        email: 'newemail@test.com',
        name: 'Updated Name',
        role: 'ADMIN',
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: { id: 'tenant-123', name: 'Test Corp', slug: 'test-corp', logoUrl: null },
      });

      const res = await request(app)
        .put('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name', email: 'newemail@test.com' })
        .expect(200);

      expect(res.body.user.name).toBe('Updated Name');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const token = jwt.sign(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'ADMIN' },
        'test-secret-key-for-testing',
      );

      mockUpdate.mockResolvedValue({ id: 'user-123' });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      expect(res.body.message).toBe('Logged out successfully.');
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should change password successfully', async () => {
      const token = jwt.sign(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'ADMIN' },
        'test-secret-key-for-testing',
      );

      const passwordHash = bcrypt.hashSync('OldPass1!', 10);
      mockFindUnique.mockResolvedValue({ id: 'user-123', passwordHash });
      mockUpdate.mockResolvedValue({ id: 'user-123' });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'OldPass1!', newPassword: 'NewPass123!' })
        .expect(200);

      expect(res.body.message).toBe('Password updated successfully.');
    });

    it('should return 401 for incorrect current password', async () => {
      const token = jwt.sign(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'ADMIN' },
        'test-secret-key-for-testing',
      );

      const passwordHash = bcrypt.hashSync('RealPass1!', 10);
      mockFindUnique.mockResolvedValue({ id: 'user-123', passwordHash });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'WrongPass1!', newPassword: 'NewPass123!' })
        .expect(401);

      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 for weak new password', async () => {
      const token = jwt.sign(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'ADMIN' },
        'test-secret-key-for-testing',
      );

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'OldPass1!', newPassword: 'weak' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION');
    });
  });

  describe('Middleware - authenticate', () => {
    it('should reject requests without Authorization header', () => {
      const req = { headers: {} } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject requests with malformed token', () => {
      const req = { headers: { authorization: 'Bearer invalid-token' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should accept valid token and call next', () => {
      const token = jwt.sign(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'ADMIN' },
        'test-secret-key-for-testing',
      );

      const req = { headers: { authorization: `Bearer ${token}` } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user!.userId).toBe('user-123');
    });
  });

  describe('Middleware - requireRole', () => {
    it('should allow user with required role', () => {
      const req = { user: { userId: 'u1', tenantId: 't1', role: 'ADMIN' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      const middleware = requireRole('ADMIN', 'SUPER_ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny user without required role', () => {
      const req = { user: { userId: 'u1', tenantId: 't1', role: 'VIEWER' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      const middleware = requireRole('ADMIN', 'SUPER_ADMIN');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 401 if not authenticated', () => {
      const req = { user: undefined } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      const middleware = requireRole('ADMIN');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
