import { PgContainer } from '@@/docker/postgres';
import getPort from 'get-port';
import { spawn } from 'child_process';
import { onExit } from 'signal-exit';

const port = await getPort();
const postgres = new PgContainer({ port, projectName: 'dev' });

Object.assign(process.env, {
  PGHOST: '0.0.0.0',
  PGDATABASE: postgres.db,
  PGUSER: postgres.username,
  PGPASSWORD: postgres.password,
  PGPORT: port,
});

postgres.start();
spawn('nodemon', { shell: true, stdio: 'inherit' });

onExit(() => {
  postgres.end();
});
