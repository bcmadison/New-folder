import { spawn } from 'child_process';
import { join } from 'path';

interface TestConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

const config: TestConfig = {
  command: 'jest',
  args: [
    '--config',
    join(__dirname, '../jest.config.json'),
    '--coverage',
    '--verbose'
  ],
  env: {
    ...process.env,
    NODE_ENV: 'test'
  }
};

function runTests() {
  console.log('Running tests...');

  const tests = spawn(config.command, config.args, {
    env: config.env,
    stdio: 'inherit'
  });

  tests.on('error', (error) => {
    console.error('Failed to run tests:', error);
    process.exit(1);
  });

  tests.on('close', (code) => {
    if (code !== 0) {
      console.error(`Tests failed with code ${code}`);
      process.exit(code);
    }
    console.log('All tests passed successfully!');
  });
}

runTests(); 