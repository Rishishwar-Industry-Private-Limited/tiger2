// Simple unit tests for auth routes using mocked AdminUser

jest.resetModules();

const users = [];

jest.mock('../models/AdminUser', () => ({
  findOne: async ({ username }) => users.find(u => u.username === username) || null,
  create: async ({ username, passwordHash, role }) => { const u = { _id: 'id-' + username, username, passwordHash, role }; users.push(u); return u; }
}));

beforeEach(() => {
  users.length = 0; // reset
});

test('POST /auth/create forbidden without setup token', async () => {
  const app = require('../server');
  const request = require('supertest')(app);

  const res = await request.post('/auth/create').send({ username: 'u1', password: 'p1' });
  expect(res.status).toBe(403);
});

test('Create admin and login flow', async () => {
  process.env.ADMIN_SETUP_TOKEN = 'test_setup_token';
  const app = require('../server');
  const request = require('supertest')(app);

  const createRes = await request.post('/auth/create').set('x-admin-setup-token', 'test_setup_token').send({ username: 'admin', password: 'secret' });
  expect(createRes.status).toBe(200);
  expect(createRes.body.created).toBe(true);

  const loginRes = await request.post('/auth/login').send({ username: 'admin', password: 'secret' });
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toBeTruthy();
});