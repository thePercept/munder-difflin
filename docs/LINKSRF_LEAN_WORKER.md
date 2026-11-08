# Lean Windows Growth Office

This opt-in extension reuses Munder as the Windows operator interface. It adds
no Munder service, server framework, browser fleet or background model loop.
The existing uncommitted Growth Office UI, role manifests, state and mock
adapter in the main checkout are preserved and are not included in this commit.

## Existing supported facilities

The inspected fork supports Codex interactive PTYs and per-agent Codex homes
(`src/main/hive.ts`), persisted missions and weekly schedules (`config.ts`,
`index.ts`), authenticated local webhooks (`webhook.ts`), Markdown hive memory,
and optional MemPalace (`memory.ts`). These are desktop app facilities, not
evidence of an unattended/headless Munder server. Do not expose its webhook
port or turn on tunnels for the pilot.

## Operator setup

Keep one existing Michael/GOD coordinator. Do not hire six persistent agents.
Research, qualification, draft, review, reply classification and evaluation are
sequential roles of the backend repository's one-shot Python/Codex adapter.
Use `maxConcurrentWorkers=1`; disable autonomous worker spawning, voice,
semantic-memory models, reflection, missions and webhook endpoints initially.
Close extra browsers and idle terminals through the normal app UI.
The profile also disables context compaction/clearing and records the existing
schedule-seeding flags so application startup cannot restore an enabled hourly
mission. Existing schedule text, trigger thresholds and unrelated settings stay
available for later manual use.

With Munder closed, locate its EXISTING user-data `config.json`, then run:

```powershell
node tools/linksrf-lean-config.cjs "<existing Munder user-data>/config.json"
node tools/linksrf-lean-config.cjs "<existing Munder user-data>/config.json" --apply
```

The first command reports only the safe profile summary. The second preserves
all unrelated settings, saves a non-overwriting private backup alongside the
configuration, and changes only the resource/automation toggles. It does not
replace the configured model, provider, hive, API credentials or agent roster.
No installed Munder user-data configuration was found during this audit, so
no live app configuration has been edited or fabricated.

## Connect the existing hive

Use `thePercept/linksrf-backend`, branch
`feature/linksrf-lean-growth-bridge-20261108`, directory
`ops/outbound-test/growth-office`. Set `munder_hive` in the worker's PRIVATE
configuration to the existing hive path. The worker writes only
`growth/lean-worker-status.json`: job ID, role, decision, approval requirement
and aggregate resource/usage measurements. It does not replace `growth/state.json`,
`BLACKBOARD.md`, agent memory or `tasks.json`.

Michael reads that compact status and uses Munder's EXISTING blocked task card
and `humanQA`/ASK ME mechanism for review. To inspect actual content, the operator
uses the adapter's `inspect --id` action. Exact-hash approval is a separate
explicit operator action, with a recorded reason. A model response, an ASK ME
answer or an imported role card cannot activate a campaign or change send controls.

The adapter runs once and exits. An opt-in Windows Task Scheduler entry may
run that command every five minutes with `MultipleInstances=IgnoreNew`; server
leases and the local OS lock provide additional exclusion. n8n remains the
durable scheduler. A sleeping/offline PC needs no public endpoint and performs
no catch-up send burst. Resume/fencing tests are in the backend package.

## Verification

```powershell
node --test test/linksrf-lean-config.test.cjs
```

Munder was not running, so its actual resident memory is **not measured**.
Do not report Electron estimates as observed RAM. Measure the existing app
after the profile is applied, with one coordinator and one finite worker.
