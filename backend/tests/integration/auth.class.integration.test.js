//auth.class.integration used to test the auth routes 
// using the class-based structure of the code, 
// ensuring that registration and login work as 
// expected with various edge cases.



//const
const fs = require('fs');
const path = require('path');
const request = require('supertest');
//const end


// block 1
// Mock email utility to prevent actual emails during
jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  getEmailDiagnostics: jest.fn().mockReturnValue({ provider: 'mock' }),
}));
// block 1 end




// block 2
// Mock video duration utility to avoid processing actual
jest.mock('get-video-duration', () => ({
  getVideoDurationInSeconds: jest.fn().mockResolvedValue(30),
}));
// block 2 end



//const
// Use a separate test database file to avoid conflicts 
// with development data
const tempDir = path.join(__dirname, '..', '..', '.test-data');
const testDbFile = path.join(tempDir, 'class-testing.sqlite');
//const end





// The tests will start the server, 
// run API requests against it,
let app;
let server;
let db;




//block 3
// Setup and teardown for the integration tests,
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'class_testing_secret';

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
//block 3 end






//block 4
// After all tests, close the server and database connections,
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
    db.close(() => finalize());
    return;
  }

  finalize();
});
//  block 4 end






//block 5
// Global error handlers to catch
describe('Auth class-based integration testing', () => {
  test('CT-AUTH-001 missing register fields returns 400 (invalid class)', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'only_name' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('All fields are required');
  });

  test('CT-AUTH-002 valid register returns 200 (valid class)', async () => {
    const unique = Date.now();
    const payload = {
      username: `class_user_${unique}`,
      email: `class_user_${unique}@example.com`,
      password: 'StrongPass1!',
    };

    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.requiresVerification).toBe(true);
  });

  test('CT-AUTH-003 duplicate register email returns 400 (invalid class)', async () => {
    const unique = Date.now() + 1;
    const payload = {
      username: `dup_user_${unique}`,
      email: `dup_user_${unique}@example.com`,
      password: 'StrongPass1!',
    };

    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send({
      username: `${payload.username}_2`,
      email: payload.email,
      password: payload.password,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email already exists');
  });

  test('CT-AUTH-004 missing login fields returns 400 (invalid class)', async () => {
    const res = await request(app).post('/api/auth/login').send({ login: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('All fields are required');
  });

  test('CT-AUTH-005 unknown user login returns 400 (invalid class)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      login: 'unknown@example.com',
      password: 'StrongPass1!',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User not found');
  });

  test('CT-AUTH-006 wrong password returns 400 (invalid class)', async () => {
    const unique = Date.now() + 2;
    const payload = {
      username: `pwd_user_${unique}`,
      email: `pwd_user_${unique}@example.com`,
      password: 'StrongPass1!',
    };

    await request(app).post('/api/auth/register').send(payload);

    const res = await request(app).post('/api/auth/login').send({
      login: payload.email,
      password: 'WrongPass1!',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid password');
  });

  test('CT-AUTH-007 unverified account login returns 403 (invalid class)', async () => {
    const unique = Date.now() + 3;
    const payload = {
      username: `unverified_user_${unique}`,
      email: `unverified_user_${unique}@example.com`,
      password: 'StrongPass1!',
    };

    await request(app).post('/api/auth/register').send(payload);

    const res = await request(app).post('/api/auth/login').send({
      login: payload.email,
      password: payload.password,
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Email not verified');
  });

  test('CT-AUTH-008 verified account login returns 200 + token (valid class)', async () => {
    const unique = Date.now() + 4;
    const payload = {
      username: `verified_user_${unique}`,
      email: `verified_user_${unique}@example.com`,
      password: 'StrongPass1!',
    };

    const registerRes = await request(app).post('/api/auth/register').send(payload);
    const userId = registerRes.body.user.id;

    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET email_verified = 1 WHERE id = ?', [userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const res = await request(app).post('/api/auth/login').send({
      login: payload.email,
      password: payload.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(payload.email);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(10);
  });
});
//block 5 end