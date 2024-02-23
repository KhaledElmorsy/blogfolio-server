import 'dotenv/config';
import express, { Router, json, ErrorRequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import Debug from 'debug';
import useragent from 'express-useragent';
import { ErrorCode } from '@blogfolio/types/Response';
import { users, authentication } from './routes';

const debug = Debug('app');

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  debug(err);
  res.sendStatus(ErrorCode.InternalServerError);
};

const app = express();
app.use(json());
app.use(helmet());
app.use(useragent.express());
app.use(cookieParser());
app.disable('x-powered-by');

const v1 = Router();
v1.use('/u', users);
v1.use('/', authentication);

app.use('/v1/', v1);
app.use(errorHandler);

const { PORT = 3000 } = process.env;
app.listen(PORT, () => {
  debug(`Server listening on port ${PORT}`);
});
