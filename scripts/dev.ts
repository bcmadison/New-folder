import { spawn } from 'child_process';
import { join } from 'path';

interface DevConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
  watch: string[];
}

const config: DevConfig = {
  command: 'nodemon',
  args: [
    '--exec',
    'ts-node',
    join(__dirname, '../src/index.ts'),
    '--watch',
    'src',
    '--ext',
    'ts'
  ],
  env: {
    ...process.env,
    NODE_ENV: 'development'
  },
  watch: ['src/**/*.ts']
};

function startDevServer() {
  console.log('Starting development server...');

  const server = spawn(config.command, config.args, {
    env: config.env,
    stdio: 'inherit'
  });

  server.on('error', (error) => {
    console.error('Development server failed to start:', error);
    process.exit(1);
  });

  server.on('close', (code) => {
    if (code !== 0) {
      console.error(`Development server exited with code ${code}`);
      process.exit(code);
    }
  });

  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down development server...');
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM signal...');
    server.kill('SIGTERM');
  });
}

startDevServer(); 