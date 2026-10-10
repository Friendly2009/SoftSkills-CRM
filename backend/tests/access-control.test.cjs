const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const express = require('express');
const root = path.resolve(__dirname, '..');
const session = (rank = 1000) => ({ user_id: 7, company_id: 1, rank });
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

function harness(answer = () => []) {
  const calls = [], cache = new Map();
  const conn = {
    async query(sql, args) { calls.push({ sql, args }); return [answer(sql, args)]; },
    async execute(sql, args) { return this.query(sql, args); },
    async beginTransaction() { calls.push({ sql: 'BEGIN' }); },
    async commit() { calls.push({ sql: 'COMMIT' }); },
    async rollback() { calls.push({ sql: 'ROLLBACK' }); },
    release() { calls.push({ sql: 'RELEASE' }); },
  };
  const pool = { ...conn, async getConnection() { calls.push({ sql: 'CONNECT' }); return conn; } };
  function load(file) {
    const absolute = path.resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute);
    const module = { exports: {} }; cache.set(absolute, module.exports);
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const requireModule = name => {
      if (name.includes('data_base_connect')) return { __esModule: true, default: pool };
      if (name === 'dotenv/config') return {};
      if (name === 'bcrypt') return {};
      if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(absolute), name.replace(/\.js$/, '.ts'))));
      return require(name);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: requireModule,
      console: { log() {}, error() {} }, process, Date, Set, Promise }, { filename: absolute });
    return module.exports;
  }
  return { load, calls, pool };
}
const mutation = calls => calls.filter(c => /^(INSERT|UPDATE|DELETE)/.test(c.sql.trim()));
const req = overrides => ({ session: session(), params: { id: '9' }, query: {}, headers: {}, body: {}, ...overrides });

for (const bad of [{}, { company_id: 1, user_id: 7 }, { ...session(), rank: NaN }, { ...session(), user_id: -1 }, { ...session(), company_id: '1' }]) {
  test(`invalid session fails before SQL: ${JSON.stringify(bad)}`, async () => {
    const h = harness(); const auth = h.load('middleware/auth.ts'); const res = response();
    let next = false; await auth.requireAuth(req({ session: bad }), res, () => { next = true; });
    assert.equal(res.code, 401); assert.equal(next, false); assert.equal(h.calls.length, 0);
  });
}
test('permissions are refreshed from the database after demotion', async () => {
  const h = harness(() => [{ id: 7, company_id: 1, rank: 100, role: 'Teacher' }]);
  const auth = h.load('middleware/auth.ts'); const request = req(); const res = response(); let allowed = false;
  await auth.requireAuth(request, res, () => auth.requireRank(500)(request, res, () => { allowed = true; }));
  assert.equal(res.code, 403); assert.equal(allowed, false); assert.equal(request.session.rank, 100);
});
test('deleted user is rejected', async () => {
  const h = harness(); const res = response(); let next = false;
  await h.load('middleware/auth.ts').requireAuth(req(), res, () => { next = true; });
  assert.equal(res.code, 401); assert.equal(next, false);
});
for (const [file, handler] of [['ClientController','delclient'], ['ClientController','updateClient'], ['ScheduleController','closeLesson'], ['FinanceController','addManualExpense'], ['AnalyticController','getChartState']]) {
  test(`${handler} rejects unauthenticated direct calls`, async () => {
    const h = harness(); const res = response();
    await h.load(`controllers/${file}.ts`)[handler](req({ session: {} }), res);
    assert.equal(res.code, 401); assert.equal(h.calls.length, 0);
  });
}
test('fake X-Session-ID cannot open the calendar', async () => {
  const h = harness(); const res = response();
  await h.load('controllers/ScheduleController.ts').getSchedule(req({ session: {}, headers: { 'x-session-id': 'anything' }, query: { startDate: '2026-01-01', endDate: '2026-01-07' } }), res);
  assert.equal(res.code, 401); assert.equal(h.calls.length, 0);
});
test('foreign client deletion is scoped and makes no membership deletion', async () => {
  const h = harness(() => ({ affectedRows: 0 })); const res = response();
  await h.load('controllers/ClientController.ts').delclient(req(), res);
  assert.equal(res.code, 404); const writes = mutation(h.calls);
  assert.equal(writes.length, 1); assert.match(writes[0].sql, /company_id = \?/); assert.deepEqual([...writes[0].args], [9, 1]);
});
test('foreign client update performs no mutation', async () => {
  const h = harness(); const res = response();
  await h.load('controllers/ClientController.ts').updateClient(req({ body: { name: 'Changed' } }), res);
  assert.equal(res.code, 404); assert.equal(mutation(h.calls).length, 0);
  assert.match(h.calls.find(c => c.sql.startsWith('SELECT')).sql, /company_id = \?/);
});
test('client cannot be reassigned to another company', async () => {
  const h = harness(); const res = response();
  await h.load('controllers/ClientController.ts').updateClient(req({ body: { name: 'Changed', company_id: 2 } }), res);
  assert.equal(res.code, 403); assert.equal(h.calls.length, 0);
});
test('valid client update stays scoped to its company', async () => {
  const h = harness(sql => sql.startsWith('SELECT name') ? [{ name: 'Own', balance: 100, company_id: 1 }] : { affectedRows: 1 }); const res = response();
  await h.load('controllers/ClientController.ts').updateClient(req({ body: { name: 'Changed' } }), res);
  assert.equal(res.code, 200); const write = mutation(h.calls)[0]; assert.match(write.sql, /company_id = \?/);
  assert.deepEqual([...write.args], ['Changed', 9, 1]);
});
test('foreign group cannot be attached to a new client', async () => {
  const h = harness(); const res = response();
  await h.load('controllers/ClientController.ts').addclient(req({ body: { name: 'New', group_ids: [22] } }), res);
  assert.equal(res.code, 404); assert.equal(mutation(h.calls).length, 0);
});
test('foreign group cannot replace an existing client membership', async () => {
  const h = harness(sql => sql.startsWith('SELECT name') ? [{ name: 'Own', balance: 0, company_id: 1 }] : []); const res = response();
  await h.load('controllers/ClientController.ts').updateClient(req({ body: { group_ids: [22] } }), res);
  assert.equal(res.code, 404); assert.equal(mutation(h.calls).length, 0);
});
test('foreign group cannot be reassigned to an owned teacher', async () => {
  const h = harness(); const res = response();
  await h.load('controllers/GroupController.ts').updategroup(req({ body: { users_id: 7 } }), res);
  assert.equal(res.code, 404); assert.equal(mutation(h.calls).length, 0);
});
test('foreign teacher cannot be assigned to a new group', async () => {
  const h = harness(); const res = response();
  await h.load('controllers/GroupController.ts').creategroup(req({ body: { name: 'New', users_id: 77, status: 1, start_date: '2026-01-01', max_students: 10 } }), res);
  assert.equal(res.code, 404); assert.equal(mutation(h.calls).length, 0);
});
test('foreign financial chart is rejected before SQL', async () => {
  const h = harness(); const res = response();
  await h.load('controllers/AnalyticController.ts').getChartState(req({ query: { companyId: '2' } }), res);
  assert.equal(res.code, 403); assert.equal(h.calls.length, 0);
});
test('teacher cannot create manual expenses', async () => {
  const h = harness(); const res = response();
  await h.load('controllers/FinanceController.ts').addManualExpense(req({ session: session(100), body: { amount: 100, category: 'Rent' } }), res);
  assert.equal(res.code, 403); assert.equal(h.calls.length, 0);
});
test('lead cannot be assigned to a foreign employee', async () => {
  const h = harness(); const res = response();
  await h.load('controllers/LeadController.ts').createLead(req({ body: { name: 'New', contact: '123', user_id: 77 } }), res);
  assert.equal(res.code, 404); assert.equal(mutation(h.calls).length, 0);
});
const lessonBody = { lessonId: 9, groupId: 10, teacherId: 7, teacherPay: 1500, startDateTime: '2020-01-01T10:00:00.000Z', endDateTime: '2020-01-01T11:00:00.000Z', students: [{ clientId: 12, attendanceStatus: 1, amountCharged: 800 }] };
function lessonRows(sql) {
  if (sql.startsWith('SELECT g.id')) return [{ id: 10, users_id: 7 }];
  if (sql.startsWith('SELECT id FROM users')) return [{ id: 7 }];
  if (sql.startsWith('SELECT l.id')) return [{ id: 9, group_id: 10, user_id: 7, status: 1, teacher_pay: 1500 }];
  return [];
}
test('foreign student cannot be charged for an owned lesson', async () => {
  const h = harness(lessonRows); const res = response();
  await h.load('controllers/ScheduleController.ts').closeLesson(req({ body: lessonBody }), res);
  assert.equal(res.code, 404); assert.equal(mutation(h.calls).length, 0);
});
test('foreign existing lesson is rejected before financial writes', async () => {
  const h = harness(sql => sql.startsWith('SELECT l.id') ? [] : lessonRows(sql)); const res = response();
  await h.load('controllers/ScheduleController.ts').closeLesson(req({ body: lessonBody }), res);
  assert.equal(res.code, 404); assert.equal(mutation(h.calls).length, 0);
});
test('forged group ID on an existing lesson is rejected', async () => {
  const h = harness(sql => sql.startsWith('SELECT l.id') ? [{ id: 9, group_id: 999, user_id: 7, status: 1 }] : lessonRows(sql)); const res = response();
  await h.load('controllers/ScheduleController.ts').closeLesson(req({ body: lessonBody }), res);
  assert.equal(res.code, 400); assert.equal(mutation(h.calls).length, 0);
});
test('teacher cannot bypass read-only state of a completed lesson', async () => {
  const h = harness(sql => sql.startsWith('SELECT l.id') ? [{ id: 9, group_id: 10, user_id: 7, status: 2 }] : lessonRows(sql)); const res = response();
  await h.load('controllers/ScheduleController.ts').closeLesson(req({ session: session(100), body: lessonBody }), res);
  assert.equal(res.code, 403); assert.equal(mutation(h.calls).length, 0);
});
test('valid teacher lesson preserves planned pay and scopes balances', async () => {
  const h = harness(sql => {
    if (sql.startsWith('SELECT c.id')) return [{ id: 12 }];
    if (sql.startsWith('SELECT status')) return [{ status: 1, user_id: 7 }];
    if (/^(INSERT|UPDATE)/.test(sql.trim())) return { affectedRows: 1, insertId: 9 };
    return lessonRows(sql);
  }); const res = response();
  await h.load('controllers/ScheduleController.ts').closeLesson(req({ session: session(100), body: { ...lessonBody, teacherPay: 99999 } }), res);
  assert.equal(res.code, 200);
  assert.equal(h.calls.some(c => c.sql.includes('SELECT balance FROM users')), false);
  const teacherWrite = h.calls.find(c => c.sql.startsWith('UPDATE users SET balance'));
  assert.deepEqual([...teacherWrite.args], [1500, 7, 1]);
});
test('all protected HTTP routes reject requests without a cookie, including fake headers', async () => {
  const h = harness(); const router = h.load('router.ts').default;
  const app = express(); app.use(express.json()); app.use((req, res, next) => { req.session = {}; next(); }); app.use(router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const publicPaths = new Set(['/signin', '/signup', '/checkconnect', '/getfeedbacks']);
    const routes = router.stack.filter(layer => layer.route && !publicPaths.has(layer.route.path));
    assert.ok(routes.length >= 35);
    for (const layer of routes) {
      const method = Object.keys(layer.route.methods)[0].toUpperCase();
      const url = `http://127.0.0.1:${server.address().port}${layer.route.path.replace(':id', '9')}`;
      const result = await fetch(url, { method, headers: { 'X-Session-ID': 'forged' } });
      assert.equal(result.status, 401, `${method} ${layer.route.path}`);
    }
    assert.equal(h.calls.length, 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
