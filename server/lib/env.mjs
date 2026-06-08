import fs from 'node:fs';
import path from 'node:path';

export function loadEnv(file = '.env') {
  const envFile = path.resolve(file);
  if (!fs.existsSync(envFile)) {
    return;
  }

  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function getServerConfig() {
  return {
    port: Number(process.env.PORT || 8787),
    adminToken: process.env.SERVER_ADMIN_TOKEN || '',
    jdUnion: {
      endpoint: process.env.JD_UNION_API_ENDPOINT || 'https://api.jd.com/routerjson',
      appKey: process.env.JD_UNION_APP_KEY || '',
      appSecret: process.env.JD_UNION_APP_SECRET || '',
      accessToken: process.env.JD_UNION_ACCESS_TOKEN || '',
      version: process.env.JD_UNION_API_VERSION || '2.0',
      siteId: process.env.JD_UNION_SITE_ID || '',
      positionId: process.env.JD_UNION_POSITION_ID || '',
      pid: process.env.JD_UNION_PID || '',
      subUnionId: process.env.JD_UNION_SUB_UNION_ID || '',
    },
  };
}
