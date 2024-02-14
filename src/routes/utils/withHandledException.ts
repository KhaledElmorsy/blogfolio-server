import type { RequestHandler } from 'express';
import { AsyncRequestHandler } from '@/types/express-util';
import { ServerError } from '@/util';

export default function withHandledException(
  callback: AsyncRequestHandler | RequestHandler,
): AsyncRequestHandler {
  return async function (req, res, next) {
    try {
      await callback(req, res, next);
    } catch (err) {
      console.log(err);
      const sentError = err instanceof ServerError ? err : new ServerError(500);
      next(sentError);
    }
  };
}
