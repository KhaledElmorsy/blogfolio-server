import { test, expect, describe, vi } from 'vitest';
import { users as userDB } from '@/db';
import { errorIDs } from '@blogfolio/types';
import { ErrorCode } from '@blogfolio/types/Response';
import User from '../User';

const BaseUser = User.__baseHandlers;

describe('Get:', () => {
  test('User ID not found: HTTP error 404, Api error: User not found', async () => {
    vi.spyOn(userDB.getUsers, 'run').mockResolvedValue([]);
    const response = await BaseUser.Get({ params: { id: 'test' }, query: {} });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toContain(errorIDs.User.UserNotFound);
    }
  });
  test('Valid user: Maps and passes query to DB handler, HTTP Success 200 w/ output', async () => {
    const user = {
      id: 'test',
      username: 'test',
      firstName: null,
      lastName: null,
      bio: null,
      followerCount: 5,
      followingCount: 2,
      photoSmall: 'test',
      photoFull: 'test',
    };

    const query = {
      fields: 'bio,firstName,lastName',
    };

    const db = vi.spyOn(userDB.getUsers, 'run').mockResolvedValue([user]);
    const response = await User.Get({
      params: { id: user.id },
      query: { fields: ['firstName', 'bio'] },
    });
    expect(db).toHaveBeenCalledWith({
      id: user.id,
      fields: query.fields,
  });
});
