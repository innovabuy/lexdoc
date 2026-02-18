const request = require('supertest');
const express = require('express');

// Create a simple test app for API endpoint testing
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LexDoc API is running',
    timestamp: new Date().toISOString(),
    environment: 'test',
  });
});

// Mock auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email and password are required', code: 'BAD_REQUEST' },
    });
  }

  if (email === 'test@test.com' && password === 'password123') {
    return res.json({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: { message: 'Invalid credentials', code: 'UNAUTHORIZED' },
  });
});

// Mock protected endpoint
app.get('/api/me', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'No token provided', code: 'UNAUTHORIZED' },
    });
  }

  const token = authHeader.split(' ')[1];
  if (token !== 'mock-jwt-token') {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token', code: 'UNAUTHORIZED' },
    });
  }

  return res.json({
    success: true,
    data: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
  });
});

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('LexDoc API is running');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/me (Protected Endpoint)', () => {
    it('should return user for valid token', async () => {
      const response = await request(app)
        .get('/api/me')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/me')
        .set('Authorization', 'NotBearer token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Response Format', () => {
  it('should return consistent success response format', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
  });

  it('should return consistent error response format', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrong' })
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('code');
  });
});
