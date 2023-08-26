import { PgContainer } from '@@/docker/postgres';
import { afterAll, beforeAll } from 'vitest';
import getPort from 'get-port';

const threadNum = process.env.VITEST_POOL_ID as string;

const port = await getPort({ port: 4000 + parseInt(threadNum, 10) });

const pgContainer = new PgContainer({
  port,
  projectName: `test_${threadNum}`,
});

Object.assign(process.env, {
  PGHOST: '0.0.0.0',
  PGPORT: port,
  PGPASSWORD: pgContainer.password,
  PGDATABASE: pgContainer.db,
  PGUSER: pgContainer.username,
});

beforeAll(() => {
  pgContainer.start();
});

afterAll(() => {
  pgContainer.end();
});
