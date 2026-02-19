const fs = require('fs');
const path = require('path');
const os = require('os');

const configDir = path.join(os.homedir(), '.config', 'opencode');
const configPath = path.join(configDir, 'opencode.json');
const pluginPath = '/home/kailashaf/.gemini/antigravity/playground/dynamic-spirit/opencode-ag-auth';

// Create config directory if it doesn't exist
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

let config = {};

// Read existing config
if (fs.existsSync(configPath)) {
    try {
        const rawData = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(rawData);
    } catch (err) {
        console.error(`Error reading or parsing ${configPath}. Starting fresh.`);
        config = {};
    }
}

// Initialize plugins array if not present
if (!config.plugin || !Array.isArray(config.plugin)) {
    config.plugin = [];
}

// Remove remote version or invalid entries if present
config.plugin = config.plugin.filter(p => p !== 'opencode-ag-auth@latest' && p !== 'opencode-ag-auth');

// Make sure our local path isn't already inside
if (!config.plugin.includes(pluginPath)) {
    config.plugin.push(pluginPath);
}

// Write the file back
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
console.log(`Successfully updated opencode.json out to point to ${pluginPath}`);
