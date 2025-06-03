import { spawn } from 'child_process';
import { join } from 'path';
import { rm } from 'fs/promises';

interface BuildConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
  outDir: string;
}

const config: BuildConfig = {
  command: 'tsc',
  args: [
    '--project',
    join(__dirname, '../tsconfig.json'),
    '--outDir',
    join(__dirname, '../dist')
  ],
  env: {
    ...process.env,
    NODE_ENV: 'production'
  },
  outDir: join(__dirname, '../dist')
};

async function build() {
  try {
    console.log('Starting build process...');

    // Clean dist directory
    console.log('Cleaning dist directory...');
    await rm(config.outDir, { recursive: true, force: true });

    // Run TypeScript compiler
    console.log('Compiling TypeScript...');
    const build = spawn(config.command, config.args, {
      env: config.env,
      stdio: 'inherit'
    });

    build.on('error', (error) => {
      console.error('Build failed:', error);
      process.exit(1);
    });

    build.on('close', (code) => {
      if (code !== 0) {
        console.error(`Build process exited with code ${code}`);
        process.exit(code);
      }
      console.log('Build completed successfully!');
    });
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build(); 