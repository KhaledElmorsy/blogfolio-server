import { spawn } from 'child_process';
import { onExit } from 'signal-exit';
import getPort from 'get-port';
import { PgContainer } from '@@/docker/postgres';

const PGPORT = `${await getPort({ port: 6384 })}`;
const PGUSER = 'postgres';
const PGPASSWORD = 'password';

const pgContainer = new PgContainer({
  port: PGPORT,
  username: PGUSER,
  password: PGPASSWORD,
  projectName: 'pgtyped',
});

pgContainer.start();

const pgtyped = spawn('pgtyped', ['-w', '-c', 'pgtyped.config.json'], {
  env: { ...process.env, PGUSER, PGPASSWORD, PGPORT },
  shell: true,
  stdio: 'inherit',
});

onExit(() => {
  console.log('Exiting...');
  pgtyped.kill();
  pgContainer.end();
});
