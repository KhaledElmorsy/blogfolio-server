import 'dotenv/config';
import { describe, test, it, expect, vi } from 'vitest';
import jsonwebtoken from 'jsonwebtoken';
import { jwt } from '..';

describe('verify', () => {
  it('Returns the userID if the token gets verified', () => {
    const payload = { userID: 'testID' };
    const verifiedPayload = JSON.parse(JSON.stringify(payload));
    vi.spyOn(jsonwebtoken, 'verify').mockReturnValue(verifiedPayload);
    const returnedUserID = jwt.verify('test');
    expect(returnedUserID).toBe(payload.userID);
  });

  test('Returns undefined if the token cant be verified', () => {
    vi.spyOn(jsonwebtoken, 'verify').mockImplementation(() => {
      throw 1;
    });
    const returnedUserID = jwt.verify('test');
    expect(returnedUserID).toBe(undefined);
  });
});

describe('generate', () => {
  it('Passes the payload, secret and duration when creating a token', () => {
    const moduleSpy = vi.spyOn(jsonwebtoken, 'sign');
    const payload = { userID: 'test' };
    jwt.generate(payload);
    expect(moduleSpy).toHaveBeenCalledWith(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_DURATION,
    });
  });
});
