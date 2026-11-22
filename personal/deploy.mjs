#!/usr/bin/env node

// Build the plugin and install it into a vault as a separate plugin, "Tasks (Personal)".
//
// The official manifest.json is left untouched: the personal manifest is generated from it,
// with the id and name from personal/identity.json. As no community plugin has this id,
// Obsidian never offers to update it.
//
// Usage (from the repository root):
//   node personal/deploy.mjs [vault] [--no-build]
//
// The vault is the argument, or else the first line of personal/vault.local (not committed),
// or else the TASKS_PERSONAL_VAULT environment variable.
//
// On the first install into a vault, the official plugin's settings and hotkeys are copied over.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OFFICIAL_ID = 'obsidian-tasks-plugin';

const args = process.argv.slice(2);
const build = !args.includes('--no-build');
const vault = args.find((arg) => !arg.startsWith('--')) ?? readVaultLocal() ?? process.env.TASKS_PERSONAL_VAULT;

if (!vault) {
    fail('No vault given. Pass it as an argument, or put its path in personal/vault.local.');
}
const obsidianDir = path.join(vault, '.obsidian');
if (!fs.existsSync(obsidianDir)) {
    fail(`Not an Obsidian vault (no .obsidian folder): ${vault}`);
}

if (build) {
    execSync('node esbuild.config.mjs production', { stdio: 'inherit' });
}

const identity = readJson(path.join('personal', 'identity.json'));
const manifest = { ...readJson('manifest.json'), ...identity };
const pluginDir = path.join(obsidianDir, 'plugins', identity.id);
const firstInstall = !fs.existsSync(pluginDir);
fs.mkdirSync(pluginDir, { recursive: true });

for (const file of ['main.js', 'styles.css']) {
    fs.copyFileSync(file, path.join(pluginDir, file));
}
fs.writeFileSync(path.join(pluginDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Installed ${manifest.name} ${manifest.version} into ${pluginDir}`);

if (firstInstall) {
    copyOfficialSettings();
    copyOfficialHotkeys();
    console.log(`Enable "${manifest.name}" in Settings > Community plugins.`);
}

const enabled = readJson(path.join(obsidianDir, 'community-plugins.json'), []);
if (enabled.includes(OFFICIAL_ID)) {
    console.warn('Warning: the official Tasks plugin is enabled in this vault. Disable it: both cannot run at once.');
}

function copyOfficialSettings() {
    const official = path.join(obsidianDir, 'plugins', OFFICIAL_ID, 'data.json');
    if (fs.existsSync(official)) {
        fs.copyFileSync(official, path.join(pluginDir, 'data.json'));
        console.log('Copied the settings of the official Tasks plugin.');
    }
}

function copyOfficialHotkeys() {
    const hotkeysFile = path.join(obsidianDir, 'hotkeys.json');
    const hotkeys = readJson(hotkeysFile, {});
    let copied = 0;
    for (const [command, keys] of Object.entries(hotkeys)) {
        const personalCommand = command.replace(`${OFFICIAL_ID}:`, `${identity.id}:`);
        if (command.startsWith(`${OFFICIAL_ID}:`) && !(personalCommand in hotkeys)) {
            hotkeys[personalCommand] = keys;
            copied++;
        }
    }
    if (copied > 0) {
        fs.writeFileSync(hotkeysFile, JSON.stringify(hotkeys, null, 2));
        console.log(`Copied ${copied} hotkey(s) of the official Tasks plugin. Reload Obsidian to use them.`);
    }
}

function readVaultLocal() {
    const file = path.join('personal', 'vault.local');
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/)[0].trim() || undefined : undefined;
}

function readJson(file, fallback) {
    if (!fs.existsSync(file) && fallback !== undefined) {
        return fallback;
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fail(message) {
    console.error(`Error: ${message}`);
    process.exit(1);
}
