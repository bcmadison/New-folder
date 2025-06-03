import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

interface InitConfig {
  directories: string[];
  dependencies: {
    production: Record<string, string>;
    development: Record<string, string>;
  };
  scripts: Record<string, string>;
}

const config: InitConfig = {
  directories: [
    'src/services/analytics',
    'src/services/api',
    'src/services/betting',
    'src/services/data',
    'src/models',
    'src/utils',
    'src/types',
    'tests',
    'logs'
  ],
  dependencies: {
    production: {
      '@tensorflow/tfjs': '^4.17.0',
      '@tensorflow/tfjs-node': '^4.17.0',
      'rxjs': '^7.8.1',
      'express': '^4.18.2',
      'dotenv': '^16.4.5',
      'node-fetch': '^3.3.2',
      'ws': '^8.16.0',
      'ml-matrix': '^6.11.0',
      'ml-random-forest': '^2.1.0',
      'ml-xgboost': '^1.1.1',
      'ml-regression': '^5.0.0',
      'ml-kernel': '^4.0.0',
      'ml-stat': '^1.3.3',
      'brain.js': '^2.0.0-beta.23',
      'mathjs': '^12.4.0',
      'dayjs': '^1.11.10',
      'uuid': '^9.0.1'
    },
    development: {
      '@types/express': '^4.17.21',
      '@types/jest': '^29.5.12',
      '@types/node': '^20.11.24',
      '@types/ws': '^8.5.10',
      '@typescript-eslint/eslint-plugin': '^7.1.1',
      '@typescript-eslint/parser': '^7.1.1',
      'eslint': '^8.57.0',
      'jest': '^29.7.0',
      'nodemon': '^3.1.0',
      'ts-jest': '^29.1.2',
      'ts-node': '^10.9.2',
      'typescript': '^5.3.3'
    }
  },
  scripts: {
    'start': 'ts-node src/index.ts',
    'build': 'tsc',
    'test': 'jest',
    'lint': 'eslint . --ext .ts',
    'dev': 'nodemon'
  }
};

async function createDirectories() {
  console.log('Creating directory structure...');
  
  for (const dir of config.directories) {
    const path = join(process.cwd(), dir);
    await mkdir(path, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function initializeGit() {
  console.log('Initializing Git repository...');
  
  try {
    await execAsync('git init');
    await writeFile('.gitignore', `
node_modules/
dist/
.env
*.log
coverage/
.DS_Store
`);
    console.log('Git repository initialized');
  } catch (error) {
    console.error('Error initializing Git:', error);
  }
}

async function installDependencies() {
  console.log('Installing dependencies...');
  
  const { production, development } = config.dependencies;
  
  try {
    // Install production dependencies
    const prodDeps = Object.entries(production)
      .map(([pkg, version]) => `${pkg}@${version}`)
      .join(' ');
    await execAsync(`npm install ${prodDeps}`);
    
    // Install development dependencies
    const devDeps = Object.entries(development)
      .map(([pkg, version]) => `${pkg}@${version}`)
      .join(' ');
    await execAsync(`npm install -D ${devDeps}`);
    
    console.log('Dependencies installed successfully');
  } catch (error) {
    console.error('Error installing dependencies:', error);
  }
}

async function setupTypeScript() {
  console.log('Setting up TypeScript configuration...');
  
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['es2020', 'dom'],
      declaration: true,
      sourceMap: true,
      outDir: './dist',
      rootDir: './src',
      strict: true,
      moduleResolution: 'node',
      baseUrl: './src',
      esModuleInterop: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      paths: {
        '@/*': ['*']
      }
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  };

  await writeFile('tsconfig.json', JSON.stringify(tsConfig, null, 2));
  console.log('TypeScript configuration created');
}

async function setupESLint() {
  console.log('Setting up ESLint configuration...');
  
  const eslintConfig = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended'
    ],
    env: {
      node: true,
      es6: true
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  };

  await writeFile('.eslintrc.json', JSON.stringify(eslintConfig, null, 2));
  console.log('ESLint configuration created');
}

async function setupJest() {
  console.log('Setting up Jest configuration...');
  
  const jestConfig = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    verbose: true
  };

  await writeFile('jest.config.json', JSON.stringify(jestConfig, null, 2));
  console.log('Jest configuration created');
}

async function setupEnvironment() {
  console.log('Setting up environment configuration...');
  
  const envExample = `# API Endpoints
SPORTRADAR_API_ENDPOINT=https://api.sportradar.com/v1
ODDS_API_ENDPOINT=https://api.oddsapi.com/v1
ESPN_API_ENDPOINT=https://api.espn.com/v1
SOCIAL_API_ENDPOINT=https://api.social-analytics.com/v1

# API Keys
SPORTRADAR_API_KEY=your_sportradar_api_key
ODDS_API_KEY=your_odds_api_key
ESPN_API_KEY=your_espn_api_key
SOCIAL_API_KEY=your_social_api_key

# WebSocket Configuration
WEBSOCKET_URL=ws://localhost:8080

# Model Configuration
MODEL_SAVE_PATH=./models
MIN_CONFIDENCE_THRESHOLD=0.7
MIN_VALUE_THRESHOLD=0.1
MAX_RISK_SCORE=0.6

# Feature Engineering
ROLLING_WINDOWS=3,5,10,20
TREND_PERIODS=5,10
SEASONALITY_PERIODS=82
INTERACTION_DEPTH=2
MIN_SAMPLES_FOR_FEATURE=100

# Risk Management
MAX_POSITION_SIZE=0.1
STOP_LOSS=0.2
MAX_DRAWDOWN=0.3
KELLY_FRACTION_MULTIPLIER=0.5

# Data Integration
DATA_UPDATE_INTERVAL=60000
CACHE_DURATION=300000
MAX_RETRIES=3
RETRY_DELAY=5000

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=prototypedb
DB_USER=dbuser
DB_PASSWORD=dbpassword

# Server
PORT=3000
NODE_ENV=development`;

  await writeFile('.env.example', envExample);
  console.log('Environment configuration template created');
}

async function initialize() {
  try {
    await createDirectories();
    await initializeGit();
    await installDependencies();
    await setupTypeScript();
    await setupESLint();
    await setupJest();
    await setupEnvironment();
    
    console.log('\nInitialization completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and update with your API keys');
    console.log('2. Run npm install to install dependencies');
    console.log('3. Run npm run dev to start development server');
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

initialize(); 