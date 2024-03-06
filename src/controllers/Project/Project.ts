import { Project as ProjectTypes } from '@blogfolio/types';
import { project as Project, user as User } from '@/services';
import { createController } from '../util';

export default createController('Project', ProjectTypes.endpoints, (error) => ({
  async GetProject(
    { params: { projectID } },
    { createResponse, createError, codes },
  ) {
    const project = await Project.findByID(projectID);
    if (!project) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Project.notFound, { projectID })],
      });
    }
    return createResponse(codes.success.Ok, project);
  },

  async GetUserProjects(
    { query: { userID } },
    { createResponse, createError, codes },
  ) {
    const userExists = !(await User.findMissing({ id: [userID] })).length;
    if (!userExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.User.UserNotFound, { id: userID })],
      });
    }
    const projects = await Project.findByUser(userID);
    return createResponse(codes.success.Ok, projects);
  },

  async Post({ body }, { createResponse, codes }, { res }) {
    const { userID } = res.locals;
    const projectID = await Project.generateID();
    await Project.insert({ ...body, userID, projectID });
    return createResponse(codes.success.Created, { projectID });
  },

  async Put(
    { body: { description, priority, skills, name, projectID } },
    { createResponse, createError, codes },
    { res },
  ) {
    const project = await Project.findByID(projectID);
    if (!project) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Project.notFound, { projectID })],
      });
    }

    if (project.userID !== res.locals.userID) {
      return createResponse(codes.error.Unauthorized, { errors: [] });
    }

    if (priority) {
      await Project.swapPriority(projectID, priority);
    } else {
      await Project.update(projectID, { description, name, skills });
    }

    return createResponse(codes.success.Ok, {});
  },

  async Delete(
    { params: { projectID } },
    { createResponse, createError, codes },
    { res },
  ) {
    const project = await Project.findByID(projectID);
    if (!project) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Project.notFound, { projectID })],
      });
    }

    if (project.userID !== res.locals.userID) {
      return createResponse(codes.error.Unauthorized, { errors: [] });
    }

    await Project.remove(projectID);
    return createResponse(codes.success.Ok, {});
  },
}));
