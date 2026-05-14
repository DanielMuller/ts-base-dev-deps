import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

const logger = console;
const legacyEslintLintStagedCommand = 'eslint --fix';
const requiredEslintLintStagedCommand = 'eslint --fix --config eslint.config.mjs';

const requiredLintStagedConfig = {
  '*.{js,mjs,cjs,ts,tsx,json,css,scss,md,yml,yaml}': ['prettier --write'],
  '*.{js,mjs,cjs,ts,tsx}': [requiredEslintLintStagedCommand],
};

async function copyConfigFile(filename, subdir = '', overwrite = false) {
  const target = path.resolve(process.cwd(), subdir, filename);
  const source = path.resolve(import.meta.dirname || path.dirname(import.meta.url.replace(/^file:\/\//, '')), subdir, filename);
  try {
    await fs.mkdir(path.dirname(target), { recursive: true });
    if (overwrite) {
      await fs.copyFile(source, target);
      logger.log(`${subdir ? subdir + '/' : ''}${filename} refreshed in consumer project`);
      return;
    }

    await fs.copyFile(source, target, fs.constants.COPYFILE_EXCL);
    logger.log(`${subdir ? subdir + '/' : ''}${filename} copied to consumer project`);
  } catch (err) {
    if (err.code === 'EEXIST') {
      logger.log(`${subdir ? subdir + '/' : ''}${filename} already exists in consumer project, skipping copy.`);
    } else {
      logger.error(`Failed to copy ${subdir ? subdir + '/' : ''}${filename}:`, err);
    }
  }
}

async function configureGitHooksPath() {
  const gitCheck = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });

  if (gitCheck.error || gitCheck.status !== 0) {
    logger.log('Skipping Husky git hook setup because the consumer project is not a git work tree.');
    return;
  }

  const hookPathResult = spawnSync('git', ['config', 'core.hooksPath', '.husky'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });

  if (hookPathResult.error || hookPathResult.status !== 0) {
    logger.error('Failed to configure git hooks path for Husky.');
    return;
  }

  logger.log('Configured Husky git hooks path in consumer project.');
}

async function ensureLintStagedConfig() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');

  let packageJsonRaw;
  try {
    packageJsonRaw = await fs.readFile(packageJsonPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.log('Skipping lint-staged configuration because package.json was not found.');
      return;
    }
    logger.error('Failed to read package.json for lint-staged setup:', err);
    return;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(packageJsonRaw);
  } catch (err) {
    logger.error('Skipping lint-staged configuration because package.json is invalid JSON:', err);
    return;
  }

  const lintStaged = packageJson['lint-staged'];
  if (lintStaged !== undefined && (typeof lintStaged !== 'object' || lintStaged === null || Array.isArray(lintStaged))) {
    logger.log('Skipping lint-staged configuration because existing lint-staged is not an object.');
    return;
  }

  const mergedLintStaged = { ...(lintStaged || {}) };
  let didChange = false;

  for (const [glob, requiredCommands] of Object.entries(requiredLintStagedConfig)) {
    const existingValue = mergedLintStaged[glob];

    if (existingValue === undefined) {
      mergedLintStaged[glob] = [...requiredCommands];
      didChange = true;
      continue;
    }

    if (typeof existingValue === 'string') {
      const normalizedExistingValue =
        glob === '*.{js,mjs,cjs,ts,tsx}' && existingValue === legacyEslintLintStagedCommand ? requiredEslintLintStagedCommand : existingValue;
      const mergedCommands = [normalizedExistingValue, ...requiredCommands.filter((cmd) => cmd !== normalizedExistingValue)];
      if (mergedCommands.length !== 1 || mergedCommands[0] !== existingValue) {
        mergedLintStaged[glob] = mergedCommands;
        didChange = true;
      }
      continue;
    }

    if (!Array.isArray(existingValue)) {
      logger.log(`Skipping lint-staged merge for ${glob} because its value is not a string or array.`);
      continue;
    }

    const mergedCommands = [...existingValue];
    if (glob === '*.{js,mjs,cjs,ts,tsx}') {
      let replacedLegacyCommand = false;
      for (let index = 0; index < mergedCommands.length; index += 1) {
        if (mergedCommands[index] === legacyEslintLintStagedCommand) {
          mergedCommands[index] = requiredEslintLintStagedCommand;
          replacedLegacyCommand = true;
        }
      }

      if (replacedLegacyCommand) {
        didChange = true;
      }
    }

    for (const command of requiredCommands) {
      if (!mergedCommands.includes(command)) {
        mergedCommands.push(command);
        didChange = true;
      }
    }
    if (glob === '*.{js,mjs,cjs,ts,tsx}') {
      const dedupedCommands = [...new Set(mergedCommands)];
      if (dedupedCommands.length !== mergedCommands.length) {
        mergedLintStaged[glob] = dedupedCommands;
        didChange = true;
        continue;
      }
    }
    mergedLintStaged[glob] = mergedCommands;
  }

  if (!didChange) {
    logger.log('lint-staged config already contains required commands.');
    return;
  }

  packageJson['lint-staged'] = mergedLintStaged;

  try {
    await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
    logger.log('Updated package.json with required lint-staged configuration.');
  } catch (err) {
    logger.error('Failed to write lint-staged configuration to package.json:', err);
  }
}

export async function postinstall() {
  await copyConfigFile('tsconfig.json');
  await copyConfigFile('tsconfig.test.json');
  await copyConfigFile('tsconfig.shared.json', '', true);
  await copyConfigFile('tsconfig.test.shared.json', '', true);
  await copyConfigFile('eslint.config.mjs');
  await copyConfigFile('eslint.shared.mjs', '', true);
  await copyConfigFile('prettier.config.mjs');
  await copyConfigFile('prettier.shared.mjs', '', true);
  await copyConfigFile('.prettierignore');
  await copyConfigFile('.gitignore');
  await copyConfigFile('pre-commit', '.husky');
  await copyConfigFile('settings.json', '.vscode');
  await copyConfigFile('extensions.json', '.vscode');
  await copyConfigFile('index.ts', 'src');
  await ensureLintStagedConfig();
  await configureGitHooksPath();
}

if (process.env.npm_lifecycle_event === 'postinstall') {
  postinstall();
}
