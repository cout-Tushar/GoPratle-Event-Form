import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app';
import { connectDatabase } from './config/database';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI must be configured.');

  await connectDatabase(uri);
  const port = Number(process.env.PORT ?? 4000);
  const server = createApp().listen(port, '0.0.0.0', () => {
    console.log(`API listening on port ${port}`);
  });

  const shutdown = () =>
    server.close(() => {
      void mongoose.disconnect().finally(() => process.exit(0));
    });

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error: unknown) => {
  console.error(
    'API startup failed:',
    error instanceof Error ? error.message : 'unknown error',
  );
  process.exit(1);
});
