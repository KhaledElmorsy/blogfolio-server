import { ResponseError, ErrorID, parseErrorID } from '@blogfolio/types';
import { ZodError } from 'zod';

export default function mapZodError(
  error: ZodError,
): ResponseError<ErrorID, { path: (string | number)[] }>[] {
  return error.issues.map((issue) => ({
    ...parseErrorID(issue.message),
    data: {
      path: issue.path,
    },
  }));
}
