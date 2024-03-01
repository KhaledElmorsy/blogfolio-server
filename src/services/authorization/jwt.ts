import jsonwebtoken from 'jsonwebtoken';

if (process.env.JWT_SECRET === undefined) {
  console.warn('JWT secret env variable not defined. Using placeholder value.');
}

if (process.env.JWT_DURATION === undefined) {
  console.warn(
    'JWT duration env variable not defined. Using placeholder value.',
  );
}

const secret = process.env.JWT_SECRET ?? 'Secret-key';
const duration = process.env.JWT_DURATION ?? '5m';

type Payload = {
  userID: string;
};

export function generate(payload: Payload) {
  return jsonwebtoken.sign(payload, secret, { expiresIn: duration });
}

export function verify(token: string) {
  let payload: Payload;
  try {
    payload = jsonwebtoken.verify(token, secret) as Payload;
  } catch (err) {
    return undefined;
  }
  return payload.userID;
}
