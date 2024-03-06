import { pool, projects as projectDB } from '@/db';
import { nanoid } from 'nanoid';

export async function findByID(projectID: string) {
  const [project] = await projectDB.get.run({ projectID }, pool);
  return project;
}

export function findByUser(userID: string) {
  return projectDB.get.run({ userID }, pool);
}

interface ProjectParams {
  name: string;
  description: string;
  skills: string[];
  priority: number;
}

export function update(projectID: string, details: Partial<ProjectParams>) {
  return projectDB.update.run({ projectID, ...details }, pool);
}

interface ProjectInsertParam extends ProjectParams {
  projectID: string;
  userID: string;
}

export function insert(details: ProjectInsertParam) {
  return projectDB.insert.run(details, pool);
}

export async function generateID() {
  let projectID;
  let foundProject;
  do {
    projectID = nanoid(7);
    foundProject = await findByID(projectID);
  } while (foundProject);
  return projectID;
}

export async function remove(projectID: string) {
  return projectDB.remove.run({ projectID }, pool);
}

export async function swapPriority(projectID: string, priority: number) {
  const targetProject = await findByID(projectID);
  const originalPriority = targetProject.priority;
  const { userID } = targetProject;
  const userProjects = await findByUser(userID);
  const projectToMove = userProjects.find(
    (project) => project.priority === priority,
  );
  const client = await pool.connect();
  client.query('BEGIN');
  await projectDB.update.run({ projectID, priority }, client);
  await projectDB.update.run(
    { projectID: projectToMove?.projectID, priority: originalPriority },
    client,
  );
  await client.query('COMMIT;');
  client.release();
}
