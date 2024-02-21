import jsonwebtoken from 'jsonwebtoken';

if (process.env.JWT_SECRET === undefined) {
  throw new Error('JWT secret env variable not defined.');
}

if (process.env.JWT_DURATION === undefined) {
  throw new Error('JWT duration env variable not defined.');
}

const secret = process.env.JWT_SECRET;
const duration = process.env.JWT_DURATION;

type Payload = {
  userID: string;
};

export function generateToken(payload: Payload) {
  return jsonwebtoken.sign(payload, secret, { expiresIn: duration });
}

export function authenticateToken(token: string) {
  let payload: Payload;
  try {
    payload = jsonwebtoken.verify(token, secret);
  } catch (err) {
    return undefined;
  }
  return payload.userID;
}
