const express = require('express');
const request = require('supertest');
const searchRouter = require('../src/routes/search').default;
const { searchProviders } = require('../src/services/searchService');

jest.mock('../src/services/searchService', () => ({
  searchProviders: jest.fn(),
}));

const mockedSearchProviders = jest.mocked(searchProviders);

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/search', searchRouter);
  return app;
}

describe('GET /api/search', () => {
  beforeEach(() => {
    mockedSearchProviders.mockReset();
  });

  it('rejects invalid latitude range', async () => {
    const app = createTestApp();

    const response = await request(app)
      .get('/api/search')
      .query({ lat: '200', lng: '28.2' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('lat must be between -90 and 90');
    expect(mockedSearchProviders).not.toHaveBeenCalled();
  });

  it('rejects invalid sort value', async () => {
    const app = createTestApp();

    const response = await request(app)
      .get('/api/search')
      .query({ sortBy: 'random' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('sortBy is invalid');
    expect(mockedSearchProviders).not.toHaveBeenCalled();
  });

  it('calls search service with bounded pagination and filters', async () => {
    const app = createTestApp();
    mockedSearchProviders.mockResolvedValueOnce([
      { id: 'p1', businessName: 'Provider 1', bio: null, averageRating: 4.9, distance: 3.2 },
    ]);

    const response = await request(app)
      .get('/api/search')
      .query({
        q: 'plumber',
        category: 'plumbing',
        lat: '-15.4',
        lng: '28.3',
        radius: '15',
        minRating: '4.3',
        maxPrice: '400',
        page: '2',
        limit: '25',
        sortBy: 'rating_desc',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(mockedSearchProviders).toHaveBeenCalledWith({
      q: 'plumber',
      category: 'plumbing',
      lat: -15.4,
      lng: 28.3,
      radius: 15,
      minRating: 4.3,
      maxPrice: 400,
      sortBy: 'rating_desc',
      page: 2,
      limit: 25,
    });
  });

  it('defaults pagination when omitted', async () => {
    const app = createTestApp();
    mockedSearchProviders.mockResolvedValueOnce([]);

    const response = await request(app).get('/api/search');

    expect(response.status).toBe(200);
    expect(mockedSearchProviders).toHaveBeenCalledWith({
      q: undefined,
      category: undefined,
      lat: undefined,
      lng: undefined,
      radius: undefined,
      minRating: undefined,
      maxPrice: undefined,
      sortBy: undefined,
      page: 1,
      limit: 20,
    });
  });
});
