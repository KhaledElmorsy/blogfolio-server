import type { NextFunction, Request, Response } from 'express';
import type { BaseController } from '../util/createController';

export default function withExpress<
  T extends BaseController<any> & { __baseHandlers: unknown },
>(controller: T) {
  type EndpointKey = keyof T extends infer K
    ? K extends `_${string}` | `#${string}`
      ? never
      : K & string
    : never;
  const endpoints = Object.keys(controller).filter((k) =>
    k.match(/^[^_#].*/),
  ) as EndpointKey[];
  const adaptedController = {} as {
    [x in EndpointKey]: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<void>;
  };
  endpoints.forEach((key) => {
    adaptedController[key] = async function (
      req: Request,
      res: Response,
      next: NextFunction,
    ) {
      const generatedResponse = await controller[key](req);
      if (generatedResponse) {
        res.status(generatedResponse.status).json(generatedResponse.body);
      } else {
        next();
      }
    };
  });
  return { ...adaptedController, _baseController: controller };
}
