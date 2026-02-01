const request = require('supertest');
const app = require('../server');

describe('Photos API', () => {
  test('GET /get-photos returns 200', async () => {
    const res = await request(app).get('/get-photos');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success');
  });

  test('POST /upload-photo without file should return 400', async () => {
    const res = await request(app).post('/upload-photo').field('deviceId','test');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
