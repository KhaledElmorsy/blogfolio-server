import { defineWorkspace } from 'vitest/config';

const allProjects = ['node', 'postgres'];
const validProjectArg = allProjects.concat(['all']);

const projectValue = process.env.TEST_PROJECT ?? 'all';

if (!validProjectArg.includes(projectValue)) {
  throw new Error(
    `Invalid test project. Possible values are ${JSON.stringify(validProjectArg)}`,
  );
}

const project = projectValue === 'all' ? allProjects.join(',') : projectValue;

export default defineWorkspace([`vite.config.{${project}}.ts`]);
