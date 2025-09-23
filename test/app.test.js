const request = require('supertest');
const app = require('../app');

describe('GET /add', () => {
  it('should return sum of a and b', async () => {
    const res = await request(app).get('/add?a=2&b=3');
    expect(res.body.result).toBe(5);
  });
});
