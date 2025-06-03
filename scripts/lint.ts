import { spawn } from 'child_process';
import { join } from 'path';

interface LintConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

const config: LintConfig = {
  command: 'eslint',
  args: [
    '.',
    '--ext',
    '.ts',
    '--config',
    join(__dirname, '../.eslintrc.json'),
    '--fix'
  ],
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
};

function lint() {
  console.log('Running linter...');

  const linter = spawn(config.command, config.args, {
    env: config.env,
    stdio: 'inherit'
  });

  linter.on('error', (error) => {
    console.error('Linting failed:', error);
    process.exit(1);
  });

  linter.on('close', (code) => {
    if (code !== 0) {
      console.error(`Linting process exited with code ${code}`);
      process.exit(code);
    }
    console.log('Linting completed successfully!');
  });
}

lint(); 