import express, { Router, json } from 'express';
import type { ErrorRequestHandler } from 'express';
import Debug from 'debug';
import { users } from './routes';

const debug = Debug('app');

const v1 = Router();
v1.use(json());
v1.use('/u', users);
v1.use((req, res) => {
  res.sendStatus(404);
});

// const handleErr: ErrorRequestHandler = (err, req, res, next) => {
//   if (err instanceof ServerError) {
//     err.respond(res);
//   } else {
//     console.log(err);
//   }
// };
// v1.use(handleErr);

const app = express();
app.use('/v1/', v1);

const { PORT = 3000 } = process.env;
app.listen(PORT, () => {
  debug(`Server listening on port ${PORT}`);
});
