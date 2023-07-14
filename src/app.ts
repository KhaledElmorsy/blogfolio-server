import express from 'express';
import Debug from 'debug';

const { PORT } = process.env;

const debug = Debug('app');
const app = express();

const port = PORT || 3000;
app.listen(PORT || 3000, () => {
  debug(`Server listening on port ${port}`);
});
