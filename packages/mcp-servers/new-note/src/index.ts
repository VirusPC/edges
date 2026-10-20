import { startServer } from "./server.js";

// Check command line arguments for transport type
const transportType = process.argv.includes('--http') ? 'http' as const : 'stdio';
const port = process.argv.includes('--port') ? parseInt(process.argv[process.argv.indexOf('--port') + 1]) : undefined;

startServer(transportType, port).catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
