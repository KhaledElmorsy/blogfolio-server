import { projects as projectDB } from '@/db';
import { describe, it, vi, expect } from 'vitest';
import * as nanoid from 'nanoid';
import * as Project from '../project';

vi.mock('nanoid');

describe('findByID', () => {
  it('Calls the db handler with the passed ID, returning the result', async () => {
    const project = {};
    const projectID = 'testID';
    const getDBSpy = vi
      .spyOn(projectDB.get, 'run')
      .mockResolvedValue([project as any]);
    const output = await Project.findByID(projectID);
    expect(getDBSpy.mock.calls[0][0]).toMatchObject({ projectID });
    expect(output).toBe(project);
  });
});

describe('findByUser', () => {
  it('Calls the db handler with the passed user ID, returning the result', async () => {
    const project = {};
    const userID = 'testID';
    const getDBSpy = vi
      .spyOn(projectDB.get, 'run')
      .mockResolvedValue([project as any]);
    const output = await Project.findByUser(userID);
    expect(getDBSpy.mock.calls[0][0]).toMatchObject({ userID });
    expect(output).toEqual([project]);
  });
});

describe('insert', () => {
  it('Calls the insertion DB handler with the passed details', async () => {
    const newProject = {
      description: 'test-d',
      name: 'test-name',
      projectID: 'testID',
      userID: 'userID',
      skills: ['test', 'skills'],
      priority: 1,
    };
    const dbInsertSpy = vi
      .spyOn(projectDB.insert, 'run')
      .mockImplementation(async () => []);
    await Project.insert(newProject);
    expect(dbInsertSpy.mock.calls[0][0]).toMatchObject(newProject);
  });
});

describe('update', () => {
  it('Calls the update DB handler with the passed details', async () => {
    const dbUpdateSpy = vi
      .spyOn(projectDB.update, 'run')
      .mockImplementation(async () => []);
    const projectID = 'testID';
    const newDetails = {
      description: 'test',
      name: 'test-name',
      skills: ['new', 'skills'],
      priority: 10,
    };
    await Project.update(projectID, newDetails);
    expect(dbUpdateSpy.mock.calls[0][0]).toMatchObject({
      ...newDetails,
      projectID,
    });
  });
});

describe('generateID', () => {
  it('Generates a unique ID thats not in the DB', async () => {
    const takenID = 'thisIDIsTaken';
    const availableID = 'thisOnesGood';
    vi.spyOn(nanoid, 'nanoid').mockReturnValueOnce(takenID);
    vi.spyOn(projectDB.get, 'run').mockResolvedValueOnce([{} as any]);
    vi.spyOn(nanoid, 'nanoid').mockReturnValueOnce(availableID);
    vi.spyOn(projectDB.get, 'run').mockResolvedValueOnce([]);
    const id = await Project.generateID();
    expect(id).toBe(availableID);
  });
});

describe('remove', () => {
  it('Calls the DB handler with the passed ID', async () => {
    const projectID = 'testID';
    const dbRemoveSpy = vi
      .spyOn(projectDB.remove, 'run')
      .mockImplementation(async () => []);
    await Project.remove(projectID);
    expect(dbRemoveSpy.mock.calls[0][0]).toMatchObject({ projectID });
  });
});
