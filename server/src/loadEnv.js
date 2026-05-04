import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPaths = [
  ...new Set([
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'server', '.env'),
    path.resolve(__dirname, '..', '.env'),
  ]),
];

/**
 * Reads .env as UTF-8 or UTF-16 LE (Windows Notepad default for “Unicode”).
 * Merges into process.env so Mongo URIs with special chars work when quoted.
 *
 * On Railway, variables are injected — skip disk .env so a stray empty file
 * cannot override Railway secrets.
 */
function mergeEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  const stat = fs.statSync(envPath);
  if (stat.size === 0) {
    console.warn(
      `[loadEnv] "${envPath}" is 0 bytes. Put your variables here and save (Ctrl+S). Compass working does not write this file.`
    );
    return;
  }

  const buf = fs.readFileSync(envPath);
  let text;

  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    text = buf.subarray(2).toString('utf16le');
  } else {
    text = buf.toString('utf8').replace(/^\uFEFF/, '');
  }

  const parsed = dotenv.parse(text);
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined && value !== null) {
      process.env[key] = String(value).replace(/\r$/, '');
    }
  }
}

const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);

if (onRailway) {
  console.log('[loadEnv] Railway detected — using platform environment variables only (skipping .env files).');
} else {
  for (const envPath of envPaths) {
    mergeEnvFile(envPath);
  }
}

if (!process.env.MONGODB_URI && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[loadEnv] MONGODB_URI is not set after checking:\n',
    envPaths
      .map((p) => {
        if (!fs.existsSync(p)) return `  - ${p} (missing)`;
        return `  - ${p} (exists, ${fs.statSync(p).size}b)`;
      })
      .join('\n')
  );
  console.warn(
    '[loadEnv] Add a line: MONGODB_URI="mongodb+srv://..." (use quotes if password has # & etc.) then save the file.'
  );
}
