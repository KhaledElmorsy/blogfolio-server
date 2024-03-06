import { describe, test, expect, vi } from 'vitest';
import { project as projectService, user as userService } from '@/services';
import { ErrorCode, SuccessCode } from '@blogfolio/types/Response';
import { errorIDs } from '@blogfolio/types';
import ProjectController from '../Project';

const Project = ProjectController.__baseHandlers;

describe('GetProject', () => {
  test('Project not found: HTTP Error Not found. Respond with ID', async () => {
    vi.spyOn(projectService, 'findByID').mockResolvedValue(undefined as any);
    const projectID = 'testID';
    const response = await Project.GetProject({ params: { projectID } });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Project.notFound,
        data: { projectID },
      });
    }
  });
  test('Project found: HTTP Succes Ok. Respond with Project', async () => {
    const project = {};
    vi.spyOn(projectService, 'findByID').mockResolvedValue(project as any);
    const response = await Project.GetProject({
      params: { projectID: 'test' },
    });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body).toBe(project);
    }
  });
});

describe('GetUserProjects', () => {
  test('User not found: HTTP Error Not found. Respond with user ID', async () => {
    vi.spyOn(userService, 'findMissing').mockResolvedValue([{ id: 'test' }]);
    const userID = 'testID';
    const response = await Project.GetUserProjects({ query: { userID } });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.User.UserNotFound,
        data: { id: userID },
      });
    }
  });

  test('User exists: HTTP Success Ok. Respond with project array', async () => {
    const projects: any[] = [];
    vi.spyOn(userService, 'findMissing').mockResolvedValue([]);
    vi.spyOn(projectService, 'findByUser').mockResolvedValue(projects as any);
    const response = await Project.GetUserProjects({
      query: { userID: 'test' },
    });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body).toBe(projects);
    }
  });
});

describe('Put', () => {
  test('Project not found: HTTP Error Not found. Respond with project ID', async () => {
    vi.spyOn(projectService, 'findByID').mockResolvedValue(undefined as any);
    const projectID = 'test';
    const response = await Project.Put(
      { body: { projectID } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Project.notFound,
        data: { projectID },
      });
    }
  });

  test('Wrong user: HTTP Error Unauthorized', async () => {
    const userID = 'wrongUser';
    const project = { userID: 'differentUser' };
    vi.spyOn(projectService, 'findByID').mockResolvedValue(project as any);
    const response = await Project.Put(
      { body: { projectID: 'test' } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.Unauthorized);
  });

  test('Correct user & priority passed: HTTP Success Ok. Call priority swap.', async () => {
    const userID = 'testUser';
    const project = { userID };
    const projectID = 'testProjectID';
    vi.spyOn(projectService, 'findByID').mockResolvedValue(project as any);
    const priority = 3;
    const prioritySpy = vi
      .spyOn(projectService, 'swapPriority')
      .mockImplementation(async () => {});
    const response = await Project.Put(
      { body: { projectID, priority } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    expect(prioritySpy).toHaveBeenCalledWith(projectID, priority);
  });

  test('Correct user & property passed: HTTP Success Ok. Call update service.', async () => {
    const userID = 'testUser';
    const project = { userID };
    const projectID = 'testProjectID';
    vi.spyOn(projectService, 'findByID').mockResolvedValue(project as any);
    const description = 'test';
    const prioritySpy = vi
      .spyOn(projectService, 'update')
      .mockImplementation(async () => []);
    const response = await Project.Put(
      { body: { projectID, description } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    expect(prioritySpy).toHaveBeenCalledWith(projectID, { description });
  });
});

describe('Post', () => {
  test('Data Ok: HTTP Success Created. Update DB. Respond with gen. ID', async () => {
    const newProject = {
      description: 'test',
      name: 'test',
      priority: 2,
      skills: ['test', 'skills'],
    };
    const userID = 'userID';
    const projectID = 'testID';
    vi.spyOn(projectService, 'generateID').mockResolvedValue(projectID);
    const insertSpy = vi
      .spyOn(projectService, 'insert')
      .mockImplementation(async () => []);
    const response = await Project.Post(
      { body: newProject },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Created);
    if (response.status === SuccessCode.Created) {
      expect(response.body.projectID).toBe(projectID);
    }
    expect(insertSpy).toHaveBeenCalledWith({
      ...newProject,
      projectID,
      userID,
    });
  });
});

describe('Delete', () => {
  test('Project not found: HTTP Error Not found. Respond with project ID', async () => {
    vi.spyOn(projectService, 'findByID').mockResolvedValue(undefined as any);
    const projectID = 'test';
    const response = await Project.Delete(
      { params: { projectID } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Project.notFound,
        data: { projectID },
      });
    }
  });

  test('Wrong user: HTTP Error Unauthorized', async () => {
    const userID = 'wrongUser';
    const project = { userID: 'differentUser' };
    vi.spyOn(projectService, 'findByID').mockResolvedValue(project as any);
    const response = await Project.Delete(
      { params: { projectID: 'test' } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.Unauthorized);
  });

  test('Correct user: HTTP Success Ok. Call remove service.', async () => {
    const userID = 'testUser';
    const project = { userID };
    const projectID = 'testProjectID';
    vi.spyOn(projectService, 'findByID').mockResolvedValue(project as any);
    const remoevSpy = vi
      .spyOn(projectService, 'remove')
      .mockImplementation(async () => []);
    const response = await Project.Delete(
      { params: { projectID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    expect(remoevSpy).toHaveBeenCalledWith(projectID);
  });
});
