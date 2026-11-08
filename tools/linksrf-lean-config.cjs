'use strict';
// Opt-in configuration patch, no core changes, process spawning or public port.
const fs = require('node:fs');
const path = require('node:path');

function leanConfig(current, catalogIds) {
  const next = structuredClone(current);
  Object.assign(next, { maxConcurrentWorkers: 1, orchestratorMaySpawn: false,
    semanticMemory: false, reflectEnabled: false, freeflowEnabled: false,
    realtimeVoiceEnabled: false, slackEnabled: false, webhookEnabled: false });
  next.knowledgeGraph = { ...current.knowledgeGraph, enabled: false };
  next.missions = (current.missions || []).map(m => ({ ...m, enabled: false }));
  next.webhookTriggers = (current.webhookTriggers || []).map(t => ({ ...t, enabled: false }));
  next.mcpDefaults = { ...current.mcpDefaults };
  for (const id of new Set([...catalogIds, ...Object.keys(next.mcpDefaults)])) {
    next.mcpDefaults[id] = { ...next.mcpDefaults[id], enabled: false };
  }
  return next;
}

if (require.main === module) {
  const [configPath, action = '--dry-run'] = process.argv.slice(2);
  if (!configPath || !['--dry-run', '--apply'].includes(action)) {
    console.error('Usage: node tools/linksrf-lean-config.cjs <existing-config.json> [--dry-run|--apply]');
    process.exitCode = 1;
  } else {
    const full = path.resolve(configPath);
    const current = JSON.parse(fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, ''));
    const source = fs.readFileSync(path.join(__dirname, '../src/shared/mcpCatalog.ts'), 'utf8');
    const ids = [...source.matchAll(/^\s+id: '([^']+)'/gm)].map(x => x[1]);
    const next = leanConfig(current, ids);
    if (action === '--apply') {
      // An existing backup is never overwritten; it may contain secrets. Keep
      // it beside the existing private app configuration, never inside Git.
      fs.copyFileSync(full, full + '.before-lean.private', fs.constants.COPYFILE_EXCL);
      fs.writeFileSync(full + '.pending', JSON.stringify(next, null, 2));
      fs.renameSync(full + '.pending', full);
    }
    console.log(JSON.stringify({ applied: action === '--apply', maxConcurrentWorkers: 1,
      automaticSpawns: false, enabledMissions: 0, enabledWebhooks: 0, voice: false,
      semanticMemory: false, enabledCatalogMcpServers: 0 }));
  }
}
module.exports = { leanConfig };
