const request = require('supertest');
const app = require('../server');

describe('Server Health Check', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET / should return 404 for root path', async () => {
    await request(app)
      .get('/')
      .expect(404);
  });
});

describe('API Routes', () => {
  test('GET /api should return API info', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);
    
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
  });
});
