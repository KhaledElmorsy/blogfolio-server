import type {
  Controller,
  ControllerSchema,
  InferController,
} from '@blogfolio/types/Controller';
import { InferEndpoint, Endpoint } from '@blogfolio/types/Endpoint';
import {
  SuccessCode,
  ErrorCode,
  Response,
  FailureResponse,
} from '@blogfolio/types/Response';
import {
  errorIDs,
  ErrorID,
  ResponseError,
} from '@blogfolio/types/ResponseError';
import type { PickValues } from '@/util';
import debug from 'debug';
import type {
  Request,
  Response as ExpressResponse,
  NextFunction,
} from 'express';
import mapZodError from './mapZodError';

/**
 * Curried generic response generator factory that returns a generator for the
 * passed response type.
 *
 * Curried because type arguments can't be partially passed in TS atm.
 * Propsal: https://github.com/microsoft/TypeScript/issues/26242
 */
function ResGenFactory<R extends Response>() {
  return function createResponse<
    S extends R['status'],
    B extends Extract<R, { status: S }>['body'],
  >(code: S, body: B) {
    return {
      status: code,
      body,
    };
  };
}

export function createError<T extends ErrorID>(id: T): ResponseError<T>;
export function createError<T extends ErrorID, D extends object>(
  id: T,
  data: D
): ResponseError<T, D>;
export function createError<
  T extends ErrorID,
  D extends object | undefined = undefined,
>(id: T, data?: D) {
  return data ? { ...id, data } : id;
}

type ResponseCodes<R extends Response> = {
  success: PickValues<typeof SuccessCode, R['status'] & SuccessCode>;
  error: PickValues<typeof ErrorCode, R['status'] & ErrorCode>;
};

export interface ExpressParameters {
  req: Request;
  res: ExpressResponse;
  next: NextFunction;
}

/**
 * What each base handler is converted into. It accepts a parsed request object
 * as defined by the schema as well as helpers to ease each endpoint definition.
 *
 * Express's route parameters are also passed in case they're needed. i.e. setting
 * cookies or accessing res.locals.
 *
 * The return value type is also inferred from the schema and has full TS
 * type hinting and checking.
 */
type EndpointHandler<T extends Endpoint, R extends Response = T['response']> = (
  request: T['request'],
  helpers: {
    codes: ResponseCodes<R>;
    createResponse: ReturnType<typeof ResGenFactory<R>>;
    createError: typeof createError;
  },
  express: ExpressParameters
) => Promise<R>;

export type WrappedHandler<T extends Endpoint> = (
  req: Request & T['request'],
  res: ExpressResponse,
  next: NextFunction
) => Promise<void>;

export type BaseController<T extends ControllerSchema<Controller>> = {
  [x in keyof T]: WrappedHandler<InferEndpoint<T[x]>>;
};

type ControllerImplementation<T extends Controller> = {
  [k in keyof T]: EndpointHandler<T[k]>;
};

type ControllerFactoryCBParams = [
  /** Main error namespace */
  Errors: typeof errorIDs,
];

const serverError: FailureResponse<
ErrorCode.InternalServerError,
[ResponseError<typeof errorIDs.General.ServerError>]
> = {
  status: ErrorCode.InternalServerError,
  body: {
    errors: [createError(errorIDs.General.ServerError)],
  },
};

export default function createController<
  T extends ControllerSchema<Controller>,
>(
  /**
   * For debugging. Logs can be accessed with the {@link debug} package at
   * "Controller:\<name\>:\<endpoint\>"
   *
   * @example
   * name = "User"
   * endpoints = {
   *  Get: {}
   *  Post: {}
   * }
   * debugNamespaces = ["Controller:User:Get", "Controller:User:Post"]
   */
  name: string,
  schema: T,
  factory: (
    ...args: ControllerFactoryCBParams
  ) => ControllerImplementation<InferController<T>>,
) {
  const controller = factory(errorIDs);
  const endpointKeys = Object.keys(schema) as (keyof T)[];
  const endpointHandlers = {} as BaseController<T>;
  /**
   * Base endpoint handler function for simpler testing. They skip parsing the request and response
   * and don't take helper parameters such as {@link ResGenFactory} or {@link createError}.
   */
  const baseHandlers = {} as {
    [x in keyof T]: (
      req: InferEndpoint<T[x]>['request'],
      expressParams?: Partial<{
        [p in keyof ExpressParameters]: Partial<ExpressParameters[p]>;
      }>
    ) => Promise<InferEndpoint<T[x]>['response']>;
  };

  const codes = { success: SuccessCode, error: ErrorCode };

  endpointKeys.forEach((key) => {
    const log = debug(`Controller:${name}:${String(key)}`);
    const endpointSchema = schema[key];
    type EndpointCurr = InferEndpoint<typeof endpointSchema>;
    const createResponse = ResGenFactory<EndpointCurr['response']>();
    const handler = controller[key];

    baseHandlers[key] = (inputRequest, expressParams?) =>
      handler(
        inputRequest,
        {
          codes,
          createResponse,
          createError,
        },
        expressParams as ExpressParameters,
      );

    endpointHandlers[key] = async function (
      req: Request,
      res: ExpressResponse,
      next: NextFunction,
    ) {
      const requestParseResult = endpointSchema.request.safeParse(req);
      if (!requestParseResult.success) {
        log(requestParseResult.error);

        // Each parse issue is mapped to an error. Create an array of those errors
        // and respond.
        res.json({
          status: ErrorCode.BadRequest,
          body: {
            errors: mapZodError(requestParseResult.error),
          },
        });
        next();
        return;
      }

      const parsedRequest = requestParseResult.data;

      let response;
      try {
        response = await handler(
          parsedRequest,
          {
            codes,
            createResponse,
            createError,
          },
          { req, res, next },
        );
      } catch (err) {
        log(err);
        res.json(serverError);
      }

      if (response === undefined) {
        next();
        return;
      }

      const responseParseResult = endpointSchema.response.safeParse(response);
      if (!responseParseResult.success) {
        log(responseParseResult.error);
        res.json(serverError);
        return;
      }
      res
        .status(responseParseResult.data.status)
        .json(responseParseResult.data.body);
    };
  });

  return { ...endpointHandlers, __baseHandlers: baseHandlers };
}
