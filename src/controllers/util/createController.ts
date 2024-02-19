import type {
  Controller,
  ControllerSchema,
  InferController,
} from '@blogfolio/types/Controller';
import { InferEndpoint, Endpoint } from '@blogfolio/types/Endpoint';
import {
  SuccessCode,
  ErrorCode,
  ResponseBodyStatus,
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
  >(code: S, bodyData: Omit<B, 'status'>) {
    const isError = !!Object.values(ErrorCode).includes(code as ErrorCode);
    const resBodyStatus = isError
      ? ResponseBodyStatus.failure
      : ResponseBodyStatus.success;
    return {
      status: code,
      body: {
        status: resBodyStatus as B['status'],
        ...bodyData,
      },
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

type EndpointHandler<T extends Endpoint, R extends Response = T['response']> = (
  request: T['request'],
  helpers: {
    codes: ResponseCodes<R>;
    response: ReturnType<typeof ResGenFactory<R>>;
    error: typeof createError;
  }
) => Promise<R>;

export type WrappedHandler<T extends Endpoint> = (
  request: T['request']
) => Promise<T['response']>;

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
    status: ResponseBodyStatus.failure,
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
      req: InferEndpoint<T[x]>['request']
    ) => Promise<InferEndpoint<T[x]>['response']>;
  };

  const codes = { success: SuccessCode, error: ErrorCode };

  endpointKeys.forEach((key) => {
    const log = debug(`Controller:${name}:${String(key)}`);
    const endpointSchema = schema[key];
    type EndpointCurr = InferEndpoint<typeof endpointSchema>;
    const createResponse = ResGenFactory<EndpointCurr['response']>();
    const handler = controller[key];
    baseHandlers[key] = (inputRequest) =>
      handler(inputRequest, {
        codes,
        response: createResponse,
        error: createError,
      });

    endpointHandlers[key] = async function (
      request: EndpointCurr['request'],
    ): Promise<EndpointCurr['response']> {
      const reqParse = endpointSchema.request.safeParse(request);
      if (!reqParse.success) {
        log(reqParse.error);
        return {
          status: ErrorCode.BadRequest,
          body: {
            status: ResponseBodyStatus.failure,
            errors: mapZodError(reqParse.error),
          },
        };
      }
      const { data: parsedRequest } = reqParse;

      let response;
      try {
        response = await handler(parsedRequest, {
          codes,
          response: createResponse,
          error: createError,
        });
      } catch (err) {
        log(err);
        return serverError;
      }
      const resParse = endpointSchema.response.safeParse(response);
      if (!resParse.success) {
        log(resParse.error);
        return serverError;
      }
      return resParse.data;
    };
  });

  return { ...endpointHandlers, __baseHandlers: baseHandlers };
}
