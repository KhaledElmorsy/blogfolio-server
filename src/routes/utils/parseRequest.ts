import { ZodError, type Schema } from 'zod';
import { ResponseError } from '@blogfolio/types/Errors';
import { Request, Response } from 'express';
import { ServerError } from '@/util';
import { ZodType } from 'node_modules/zod/lib';

/**
 * Define a middleware that parses and transforms the request object according
 * to the passed schema.
 *
 * Sends an HTTP 400 error (bad request) if the request shape isn't valid.
 * @param schema Request object schema
 */
export default function parseRequest<T extends ZodType>(
  schema: T,
  req: Request,
): T['_output'] {
  try {
    return schema.parse(req);
  } catch (err) {
    /*
        Schemas imported from different modules produce errors from that module's
        z.ZodError class. Making them instances of "different" classes.
        Setting zod as a peer dependency doesn't work when using esm (type: module).
        Github Issue: https://github.com/colinhacks/zod/issues/2241
       */
    Object.setPrototypeOf(err, ZodError.prototype);
    if (err instanceof ZodError) {
      const errors: ResponseError[] = err.issues.map(({ message, path }) => ({
        message,
        detail: path,
      }));
      throw new ServerError(400, errors);
    }
    return null;
  }
}
