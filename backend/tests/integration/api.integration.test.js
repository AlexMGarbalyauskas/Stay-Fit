const fs = require('fs');
const path = require('path');
const request = require('supertest');

jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  getEmailDiagnostics: jest.fn().mockReturnValue({ provider: 'mock' }),
}));

jest.mock('get-video-duration', () => ({
  getVideoDurationInSeconds: jest.fn().mockResolvedValue(30),
}));

const tempDir = path.join(__dirname, '..', '..', '.test-data');
const testDbFile = path.join(tempDir, 'integration.sqlite');

let app;
let server;
let db;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'integration_test_secret';

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }

  process.env.DATABASE_FILE = testDbFile;

  ({ app, server } = require('../../server'));
  db = require('../../db');
});

afterAll((done) => {
  const finalize = () => {
    if (server && typeof server.close === 'function') {
      server.close(() => {
        if (fs.existsSync(testDbFile)) {
          fs.unlinkSync(testDbFile);
        }
        done();
      });
      return;
    }

    if (fs.existsSync(testDbFile)) {
      fs.unlinkSync(testDbFile);
    }
    done();
  };

  if (db && typeof db.close === 'function') {
    db.close(() => {
      finalize();
    });
    return;
  }

  finalize();
});

describe('API integration tests', () => {
  test('GET / returns API health text', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Stay-Fit API running');
  });

  test('POST /api/auth/register rejects missing required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'integration_user' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('All fields are required');
  });

  test('POST /api/auth/register creates user and requires verification', async () => {
    const unique = Date.now();
    const payload = {
      username: `integration_${unique}`,
      email: `integration_${unique}@example.com`,
      password: 'StrongPass1!',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(payload.email);
    expect(response.body.requiresVerification).toBe(true);
  });

  test('POST /api/auth/login blocks unverified users', async () => {
    const unique = Date.now() + 1;
    const registerPayload = {
      username: `integration_login_${unique}`,
      email: `integration_login_${unique}@example.com`,
      password: 'StrongPass1!',
    };

    await request(app).post('/api/auth/register').send(registerPayload);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        login: registerPayload.email,
        password: registerPayload.password,
      });

    expect(loginResponse.status).toBe(403);
    expect(loginResponse.body.error).toBe('Email not verified');
  });
});
