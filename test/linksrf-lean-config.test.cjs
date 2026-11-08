'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { leanConfig } = require('../tools/linksrf-lean-config.cjs');

test('lean profile caps workers, disables automatic loops, preserves unrelated state and credentials', () => {
  const original = { harnessHome: 'existing-hive', defaultModel: 'owner-model',
    maxConcurrentWorkers: 4, orchestratorMaySpawn: true, unrelated: { keep: true },
    missions: [{ id: 'existing', enabled: true, body: 'preserve' }],
    webhookTriggers: [{ id: 'existing', enabled: true, secret: 'synthetic-secret' }],
    mcpDefaults: { custom: { enabled: true } }, knowledgeGraph: { enabled: true, custom: 1 } };
  const next = leanConfig(original, ['filesystem']);
  assert.equal(next.maxConcurrentWorkers, 1);
  assert.equal(next.orchestratorMaySpawn, false);
  assert.equal(next.missions[0].enabled, false);
  assert.equal(next.missions[0].body, 'preserve');
  assert.equal(next.webhookTriggers[0].secret, 'synthetic-secret');
  assert.equal(next.webhookTriggers[0].enabled, false);
  assert.equal(next.mcpDefaults.custom.enabled, false);
  assert.equal(next.mcpDefaults.filesystem.enabled, false);
  assert.deepEqual(next.unrelated, original.unrelated);
  assert.equal(original.maxConcurrentWorkers, 4);
});

test('lean profile is idempotent, with no model or provider substitution', () => {
  const once = leanConfig({ godProvider: 'codex', godModel: 'owner-selected' }, ['git']);
  assert.deepEqual(leanConfig(once, ['git']), once);
  assert.equal(once.godModel, 'owner-selected');
  assert.equal(once.godProvider, 'codex');
  assert.equal(once.freeflowEnabled, false);
  assert.equal(once.reflectEnabled, false);
  assert.equal(once.semanticMemory, false);
});

test('lean profile remains inactive after real config defaults and startup mission seeding', () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'md-lean-startup-'));
  const electron = require.resolve('electron');
  const previous = require.cache[electron];
  require.cache[electron] = { id: electron, filename: electron, loaded: true,
    exports: { app: { getPath: () => userData } } };
  try {
    const loadTs = require('./load-ts.cjs');
    const config = loadTs('src/main/config.ts');
    const { DEFAULT_CONTEXT_TRIGGER } = loadTs('src/shared/triggers.ts');
    const source = ts.createSourceFile('index.ts', fs.readFileSync(
      path.join(__dirname, '../src/main/index.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
    const startup = source.statements.find(node => ts.isFunctionDeclaration(node)
      && node.name?.text === 'ensureDefaultMissions');
    assert.ok(startup, 'exercise the actual application startup function');
    const code = ts.transpileModule(startup.getText(source), { compilerOptions:
      { target: ts.ScriptTarget.ES2022 } }).outputText;
    const context = vm.createContext({ readConfig: config.readConfig,
      writeConfig: config.writeConfig, OPS_STANDUP_MISSION: config.OPS_STANDUP_MISSION,
      HEARTBEAT_MISSION: config.HEARTBEAT_MISSION,
      COMPACT_MAINTENANCE_MISSION: config.COMPACT_MAINTENANCE_MISSION,
      DEFAULT_CONTEXT_TRIGGER, Date, console, contextRunMap: () => ({}),
      persist: { setKv() {} }, CONTEXT_LAST_RUN_KV_KEY: 'synthetic' });
    for (const missions of [[], [{ id: 'compact-maintenance', enabled: true,
      intervalMs: 7200000, lastFiredAt: 1 }]]) {
      fs.writeFileSync(path.join(userData, 'config.json'), JSON.stringify(leanConfig(
        { missions, unrelated: 'preserve' }, [])));
      vm.runInContext(code + '\nensureDefaultMissions(); ensureDefaultMissions();', context);
      const current = config.readConfig();
      assert.equal(current.missions.some(m => m.enabled), false);
      assert.equal(current.contextTrigger.compact.enabled, false);
      assert.equal(current.contextTrigger.clear.enabled, false);
      assert.equal(current.unrelated, 'preserve');
    }
  } finally {
    if (previous) require.cache[electron] = previous;
    else delete require.cache[electron];
    fs.rmSync(userData, { recursive: true, force: true });
  }
});
