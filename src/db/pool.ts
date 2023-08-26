import { Pool, types } from 'pg';

const FALLBACK_PORT = 5050;

// Parse bigints as numbers
types.setTypeParser(types.builtins.INT8, (val) => parseInt(val, 10));

export default new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT ?? `${FALLBACK_PORT}`, 10),
});
