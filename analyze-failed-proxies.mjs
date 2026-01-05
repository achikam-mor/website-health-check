import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the log file
const logContent = fs.readFileSync(path.join(__dirname, 'prxss.txt'), 'utf-8');

// Parse the log file
const proxyStats = new Map();

// Split into sections by proxy entries
const lines = logContent.split('\n');
let currentProxy = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match proxy line: 📍 Proxy: IP:PORT (Country)
    const proxyMatch = line.match(/Proxy:\s+([\d.]+):(\d+)/);
    if (proxyMatch) {
        currentProxy = {
            host: proxyMatch[1],
            port: parseInt(proxyMatch[2], 10),
            attempts: 0,
            successes: 0,
            failures: 0
        };
        continue;
    }
    
    // Match Attempts line
    const attemptsMatch = line.match(/Attempts:\s+(\d+)/);
    if (attemptsMatch && currentProxy) {
        currentProxy.attempts = parseInt(attemptsMatch[1], 10);
        continue;
    }
    
    // Match Successes line
    const successesMatch = line.match(/Successes:\s+(\d+)/);
    if (successesMatch && currentProxy) {
        currentProxy.successes = parseInt(successesMatch[1], 10);
        continue;
    }
    
    // Match Failures line
    const failuresMatch = line.match(/Failures:\s+(\d+)/);
    if (failuresMatch && currentProxy) {
        currentProxy.failures = parseInt(failuresMatch[1], 10);
        
        // Store this proxy data
        const ip = currentProxy.host;
        if (!proxyStats.has(ip)) {
            proxyStats.set(ip, {
                host: ip,
                ports: new Set(),
                totalAttempts: 0,
                totalSuccesses: 0,
                totalFailures: 0,
                appearances: 0
            });
        }
        
        const stats = proxyStats.get(ip);
        stats.ports.add(currentProxy.port);
        stats.totalAttempts += currentProxy.attempts;
        stats.totalSuccesses += currentProxy.successes;
        stats.totalFailures += currentProxy.failures;
        stats.appearances++;
        
        currentProxy = null;
        continue;
    }
}

// Find IPs that should be blacklisted
const toBlacklist = [];
const allResults = [];

for (const [ip, stats] of proxyStats.entries()) {
    const result = {
        ip: ip,
        totalAttempts: stats.totalAttempts,
        totalSuccesses: stats.totalSuccesses,
        totalFailures: stats.totalFailures,
        successRate: stats.totalAttempts > 0 
            ? ((stats.totalSuccesses / stats.totalAttempts) * 100).toFixed(2) + '%'
            : '0%',
        shouldBlacklist: false
    };

    // Check if IP should be blacklisted:
    // 1. Used more than 5 times
    // 2. 100% failure rate (0 successes)
    if (stats.totalAttempts > 5 && stats.totalSuccesses === 0) {
        result.shouldBlacklist = true;
        toBlacklist.push({
            host: ip,
            port: stats.appearances[0].port, // Use first port seen
            protocol: 'http',
            reason: `100% failure rate (${stats.totalAttempts} executions, 0 successes)`,
            executions: stats.totalAttempts,
            failures: stats.totalFailures,
            successRate: '0%'
        });
    }

    allResults.push(result);
}

// Sort results by total attempts (descending)
allResults.sort((a, b) => b.totalAttempts - a.totalAttempts);

// Generate matrix report
console.log('\n' + '='.repeat(80));
console.log('PROXY ANALYSIS MATRIX');
console.log('='.repeat(80));
console.log('\n');

console.log(sprintf('%-18s | %8s | %10s | %10s | %12s | %10s', 
    'IP Address', 'Attempts', 'Successes', 'Failures', 'Success Rate', 'Blacklist'));
console.log('-'.repeat(80));

function sprintf(format, ...args) {
    let i = 0;
    return format.replace(/%-?(\d+)s/g, (match, width) => {
        const arg = String(args[i++] || '');
        const w = parseInt(width);
        if (match.startsWith('%-')) {
            return arg.padEnd(w);
        }
        return arg.padStart(w);
    });
}

for (const result of allResults) {
    const blacklistStatus = result.shouldBlacklist ? 'YES ⚠️' : 'NO';
    console.log(sprintf('%-18s | %8d | %10d | %10d | %12s | %10s',
        result.ip,
        result.totalAttempts,
        result.totalSuccesses,
        result.totalFailures,
        result.successRate,
        blacklistStatus
    ));
}

console.log('\n');
console.log('='.repeat(80));
console.log(`Total IPs analyzed: ${allResults.length}`);
console.log(`IPs to blacklist: ${toBlacklist.length}`);
console.log('='.repeat(80));
console.log('\n');

// Update the proxy files
console.log('Updating proxy files...\n');

// Read existing files
const blacklistPath = path.join(__dirname, 'BlackListProxies.json');
const verifiedPath = path.join(__dirname, 'verified-proxies.json');
const workingPath = path.join(__dirname, 'working-proxies.json');

let blacklist = [];
let verified = [];
let working = [];

try {
    blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf-8'));
} catch (e) {
    console.log('Could not read BlackListProxies.json, starting fresh');
}

try {
    verified = JSON.parse(fs.readFileSync(verifiedPath, 'utf-8'));
} catch (e) {
    console.log('Could not read verified-proxies.json');
}

try {
    working = JSON.parse(fs.readFileSync(workingPath, 'utf-8'));
} catch (e) {
    console.log('Could not read working-proxies.json');
}

// Get IPs to blacklist as a Set for faster lookup
const blacklistIPs = new Set(toBlacklist.map(p => p.host));

// Add new IPs to blacklist (avoid duplicates)
const existingBlacklistIPs = new Set(blacklist.map(p => p.host));
for (const proxy of toBlacklist) {
    if (!existingBlacklistIPs.has(proxy.host)) {
        blacklist.push(proxy);
        console.log(`✓ Added ${proxy.host} to blacklist`);
    } else {
        console.log(`- ${proxy.host} already in blacklist`);
    }
}

// Remove blacklisted IPs from verified and working lists
const originalVerifiedCount = verified.length;
const originalWorkingCount = working.length;

verified = verified.filter(p => {
    if (blacklistIPs.has(p.host)) {
        console.log(`✓ Removed ${p.host} from verified-proxies`);
        return false;
    }
    return true;
});

working = working.filter(p => {
    if (blacklistIPs.has(p.host)) {
        console.log(`✓ Removed ${p.host} from working-proxies`);
        return false;
    }
    return true;
});

// Save updated files
fs.writeFileSync(blacklistPath, JSON.stringify(blacklist, null, 4));
fs.writeFileSync(verifiedPath, JSON.stringify(verified, null, 4));
fs.writeFileSync(workingPath, JSON.stringify(working, null, 4));

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Blacklist: ${blacklist.length} proxies (added ${blacklist.length - (blacklist.length - toBlacklist.length + existingBlacklistIPs.size)})`);
console.log(`Verified: ${verified.length} proxies (removed ${originalVerifiedCount - verified.length})`);
console.log(`Working: ${working.length} proxies (removed ${originalWorkingCount - working.length})`);
console.log('='.repeat(80));
