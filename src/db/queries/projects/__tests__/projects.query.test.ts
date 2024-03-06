import { generateDBInserts, testData } from '@/db/test-utils';
import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
} from 'vitest';
import { pool } from '@/db';
import { PoolClient } from 'pg';
import * as projectDB from '../projects.queries';

beforeAll(async () => {
  await pool.query(generateDBInserts(testData, ['users', 'projects']));
});

let client: PoolClient;

beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
});

afterEach(async () => {
  await client.query('ROLLBACK;');
  client.release();
});

afterAll(async () => {
  await pool.end();
});

describe('get', () => {
  it('Gets projects by userID', async () => {
    const user = testData.users[0];
    const projects = testData.projects.filter(
      (project) => project.user_id === user.user_id,
    );
    const projectIDs = projects.map(({ project_uid }) => project_uid);
    const dbProjects = await projectDB.get.run(
      { userID: user.user_uid },
      client,
    );
    const dbProjectIDs = dbProjects.map(({ projectID }) => projectID);
    expect(dbProjectIDs.sort()).toEqual(projectIDs.sort());
  });

  it('Returns the project with the passed ID', async () => {
    const project = testData.projects[1];
    const projectID = project.project_uid;
    const [dbProject] = await projectDB.get.run({ projectID }, client);
    expect(dbProject.name).toBe(project.name);
    expect(dbProject.description).toBe(project.description);
    expect(dbProject.priority).toBe(project.priority);
  });
});

describe('insert', () => {
  it('Inserts a new project into the DB', async () => {
    const projectUser = testData.users[0];
    const newProject: projectDB.IInsertParams = {
      description: 'test descr',
      name: 'test',
      priority: 100,
      projectID: 'test-id',
      skills: ['hello', 'world'],
      userID: projectUser.user_uid,
    };
    await projectDB.insert.run(newProject, client);
    const dbProject = (
      await client.query(
        `SELECT 
          name, 
          description, 
          priority,
          skills,
          project_uid as "projectID",
          user_id as "userID" 
        FROM projects WHERE project_uid = $1;`,
        [newProject.projectID],
      )
    ).rows[0];
    expect(dbProject).toMatchObject({
      ...newProject,
      userID: projectUser.user_id,
    });
  });
});

describe('update', () => {
  it('Updates row values for the passed project ID with passed values', async () => {
    const project = testData.projects[0];
    const description = `${project.description} but better`;
    const name = `${project.name} but worse?`;
    const skills = ['why not', 'both'];
    const priority = 1000;
    await projectDB.update.run(
      {
        description,
        name,
        skills,
        priority,
        projectID: project.project_uid,
      },
      client,
    );
    const [updatedProject] = (
      await client.query('SELECT * FROM projects WHERE project_uid = $1;', [
        project.project_uid,
      ])
    ).rows;
    expect(updatedProject).toMatchObject({
      description,
      name,
      skills,
      priority,
    });
  });
});

describe('remove', () => {
  it('Deletes the project with the passed ID from the DB', async () => {
    const project = testData.projects[0];
    await projectDB.remove.run({ projectID: project.project_uid }, client);
    const dbResult = await client.query(
      'SELECT * FROM projects WHERE project_uid = $1;',
      [project.project_uid],
    );
    expect(dbResult.rowCount).toBe(0);
  });
});
