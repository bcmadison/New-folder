import { spawn } from 'child_process';
import { join } from 'path';

interface ProdConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

const config: ProdConfig = {
  command: 'node',
  args: [join(__dirname, '../dist/index.js')],
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
};

function startProdServer() {
  console.log('Starting production server...');

  const server = spawn(config.command, config.args, {
    env: config.env,
    stdio: 'inherit'
  });

  server.on('error', (error) => {
    console.error('Production server failed to start:', error);
    process.exit(1);
  });

  server.on('close', (code) => {
    if (code !== 0) {
      console.error(`Production server exited with code ${code}`);
      process.exit(code);
    }
  });

  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down production server...');
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM signal...');
    server.kill('SIGTERM');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    server.kill('SIGTERM');
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.kill('SIGTERM');
    process.exit(1);
  });
}

startProdServer(); 