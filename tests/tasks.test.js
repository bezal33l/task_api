const request = require('supertest');

// We need a version of the app that doesn't connect to a real database.
// We mock the database pool so tests run without PostgreSQL.
jest.mock('../src/db', () => ({
  pool: {
    query: jest.fn(),
  },
  initDb: jest.fn().mockResolvedValue(undefined),
}));

const { pool } = require('../src/db');
const app = require('../src/app'); // We need to export app separately (see below)

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET /health ──────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── GET /tasks ───────────────────────────────────────────────────────
describe('GET /tasks', () => {
  it('returns a list of tasks', async () => {
    const mockTasks = [
      { id: 1, title: 'Task One', status: 'pending' },
      { id: 2, title: 'Task Two', status: 'done' },
    ];
    pool.query.mockResolvedValueOnce({ rows: mockTasks });

    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Task One');
  });

  it('returns 500 when database fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection refused'));

    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});

// ── POST /tasks ──────────────────────────────────────────────────────
describe('POST /tasks', () => {
  it('creates a task and returns 201', async () => {
    const newTask = { id: 3, title: 'New Task', description: 'Do it', status: 'pending' };
    pool.query.mockResolvedValueOnce({ rows: [newTask] });

    const res = await request(app)
      .post('/tasks')
      .send({ title: 'New Task', description: 'Do it' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('New Task');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ description: 'No title here' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Title is required');
  });
});

// ── PATCH /tasks/:id ─────────────────────────────────────────────────
describe('PATCH /tasks/:id', () => {
  it('updates status and returns the updated task', async () => {
    const updated = { id: 1, title: 'Task One', status: 'done' };
    pool.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .patch('/tasks/1')
      .send({ status: 'done' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('done');
  });

  it('returns 400 for an invalid status', async () => {
    const res = await request(app)
      .patch('/tasks/1')
      .send({ status: 'flying' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when task does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/tasks/999')
      .send({ status: 'done' });

    expect(res.statusCode).toBe(404);
  });
});

// ── DELETE /tasks/:id ────────────────────────────────────────────────
describe('DELETE /tasks/:id', () => {
  it('deletes a task and returns 200', async () => {
    const deleted = { id: 1, title: 'Task One', status: 'pending' };
    pool.query.mockResolvedValueOnce({ rows: [deleted] });

    const res = await request(app).delete('/tasks/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Task deleted');
  });

  it('returns 404 when task does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/tasks/999');
    expect(res.statusCode).toBe(404);
  });
});
