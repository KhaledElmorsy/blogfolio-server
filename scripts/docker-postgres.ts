import { Command } from 'commander';
import { PgContainer } from '@@/docker/postgres';
import getPort from 'get-port';

const { defaultValues } = PgContainer;

const program = new Command();

program
  .name('docker-postgres')
  .description('Spin up a postgres container for testing or development');

program
  .option(
    '-u --username <username>',
    'Server root user name',
    defaultValues.username,
  )
  .option(
    '--pass --password <password>',
    'Root user password',
    defaultValues.password,
  )
  .option('-d --db --database <db-name>', 'Database name', defaultValues.db)
  .option('-p --port <port>', 'Host port to expose', `${defaultValues.port}`)
  .option(
    '-m --migration <migration-path>',
    'Migration files/folders path',
    defaultValues.migration,
  )
  .option(
    '-n --name <project-name>',
    `Project name [\\-_a-z0-9] -> "${PgContainer.projectPrefix}<project-name>"`,
  );

const opts = program.parse().opts();

const { port, password, username, db, name: projectName, migration } = opts;

const pgContainer = new PgContainer({
  projectName: projectName ?? Math.random().toString(16).slice(2, 6),
  db,
  migration,
  password,
  port: await getPort(port),
  username,
});

program
  .command('up')
  .description('Build and start the contrainer')
  .action(() => {
    pgContainer.start();
  });

program
  .command('down')
  .description('Stop the container and remove networks/volumes/local images')
  .action(() => {
    pgContainer.end();
  });

program.parse();
