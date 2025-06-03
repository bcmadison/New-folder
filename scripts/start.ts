import { spawn } from 'child_process';
import { join } from 'path';

interface ProcessConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

const config: ProcessConfig = {
  command: 'ts-node',
  args: [join(__dirname, '../src/index.ts')],
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
};

function startApp() {
  console.log('Starting application...');

  const app = spawn(config.command, config.args, {
    env: config.env,
    stdio: 'inherit'
  });

  app.on('error', (error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });

  app.on('close', (code) => {
    if (code !== 0) {
      console.error(`Application process exited with code ${code}`);
      process.exit(code);
    }
  });

  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down...');
    app.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM signal...');
    app.kill('SIGTERM');
  });
}

startApp(); 