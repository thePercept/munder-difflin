'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
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
