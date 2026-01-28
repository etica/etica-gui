#!/usr/bin/env node
/**
 * Enode Validator Script
 *
 * Checks if enodes are reachable by attempting TCP connections to their IP:port.
 *
 * Usage:
 *   node scripts/check-enodes.js                    # Check static-nodes.json
 *   node scripts/check-enodes.js --update           # Check and update static-nodes.json with active nodes
 *   node scripts/check-enodes.js --check-new        # Also check the new candidate enodes
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

// Timeout for connection attempts (ms)
const CONNECTION_TIMEOUT = 5000;

// Path to static-nodes.json
const STATIC_NODES_PATH = path.join(__dirname, '..', 'needs', 'static-nodes.json');

// New candidate enodes to check
const NEW_CANDIDATE_ENODES = [
  "enode://7f2d5370b11c604f348da0ce62ad21aafa32cf7136c94496dbf39bf261e6c317dea25e41dfc20894f89e30c4a4b1a76f52e3742fffd77c690f8d5e1c3ae1c2b4@62.72.177.101:30310",
  // "enode://42882648816d8edb3912138e3802d28ba9289c3e8ca671caef87bbfa5a4d1a741507c7b41e6cc978285a9647c6b32500c1fef6793c0a1d25108eca4634c24cb9@192.168.0.40:30310", // Private IP - skip
  "enode://923cfa4e5059cc217a5ef2da6543b6ec86dfb0fb8f3b9c9e843a0a1db4c21ba5d9d6c9f493f20bee3a4775f8f7657d68ba5a463586a3c3227af7cd127012a207@99.248.100.186:30314",
  "enode://c2c5f92c7658c0fb7fa5397eba5138dd95f20e12158eabd284934896a66746b85d6959e47812951f983c6ea6957fb559ca098319ed76824b62ac6a4ff72e87ae@99.248.100.186:30410",
  "enode://6c55ea76133e51c305b3c9db4d2557564c120cecf8e840d23bf3fdfb27e1b869b09ec1c32f3589368c7c6a3e760a17e5754c0ea95675ed5c0ff62bf63ac28d19@99.248.100.186:30319",
  "enode://9240c49f01777c32abcec322ee8ca3e3441351f20d6a17e30cee162a9f4cb8766fd342bd00407a04d8e00373be420346007c13da6f9cc76b45280a0ec043a009@83.216.114.8:30303",
  "enode://17fe0d982a1951a44af05152c0d43e366672cd3059bcb4947a65077c91cb39ac650eeae928049d7b620a1e6533cb499d02f5697940ba0c0384506f68542eccca@83.216.114.8:30303",
  "enode://6b9b1f22eee866fdd3e7a04a70ef19fefdd4c447c2627379f334367dfe0eeaa318269b06aba741c28b64f784f33947d4c8a5795e542561dd7332fc59b1540504@83.216.114.8:30303",
  "enode://b4c5b16889c6631928b29d3257b8328bc731fd1f594e750b9c8ca9fc8f907b040906852d64739ef4bb568841c409c2667ced97b1b95b79910bf49f244059e128@99.248.100.186:34310",
  "enode://44024f1df7351de1e0de9484f9289cc49255ed8dea626acf18e8fe70fa87e42f7202e52c048a8ff24bebf0cb5cb5d97eaf3557bb6a32d9724f0a205b1dfea6d4@99.248.100.186:30410",
  "enode://44024f1df7351de1e0de9484f9289cc49255ed8dea626acf18e8fe70fa87e42f7202e52c048a8ff24bebf0cb5cb5d97eaf3557bb6a32d9724f0a205b1dfea6d4@62.72.177.101:30303",
  "enode://05e849326b412dd1c22886a246f71f87268410724623e0defa93a7d658fae4ae2bcdf249c3044292062224d322834e39161649b2fcb879d8455f567e3213113a@62.72.177.101:30303"
];

/**
 * Parse enode URL to extract IP and port
 * @param {string} enode - enode URL
 * @returns {object|null} - {id, ip, port} or null if invalid
 */
function parseEnode(enode) {
  const match = enode.match(/enode:\/\/([a-fA-F0-9]+)@([^:]+):(\d+)/);
  if (match) {
    return {
      id: match[1],
      ip: match[2],
      port: parseInt(match[3], 10),
      full: enode
    };
  }
  return null;
}

/**
 * Check if a host:port is reachable via TCP
 * @param {string} ip - IP address
 * @param {number} port - Port number
 * @returns {Promise<boolean>} - true if reachable
 */
function checkConnection(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(CONNECTION_TIMEOUT);

    socket.on('connect', () => {
      cleanup();
      resolve(true);
    });

    socket.on('timeout', () => {
      cleanup();
      resolve(false);
    });

    socket.on('error', () => {
      cleanup();
      resolve(false);
    });

    socket.connect(port, ip);
  });
}

/**
 * Check an enode and return result
 * @param {string} enode - enode URL
 * @returns {Promise<object>} - {enode, active, ip, port, error}
 */
async function checkEnode(enode) {
  const parsed = parseEnode(enode);
  if (!parsed) {
    return { enode, active: false, error: 'Invalid enode format' };
  }

  // Skip private IPs
  if (parsed.ip.startsWith('192.168.') || parsed.ip.startsWith('10.') || parsed.ip.startsWith('172.16.')) {
    return { enode, active: false, ip: parsed.ip, port: parsed.port, error: 'Private IP (not publicly reachable)' };
  }

  const active = await checkConnection(parsed.ip, parsed.port);
  return { enode, active, ip: parsed.ip, port: parsed.port, id: parsed.id.substring(0, 16) + '...' };
}

/**
 * Load enodes from static-nodes.json
 * @returns {Array<string>}
 */
function loadStaticNodes() {
  try {
    if (fs.existsSync(STATIC_NODES_PATH)) {
      const content = fs.readFileSync(STATIC_NODES_PATH, 'utf8');
      const nodes = JSON.parse(content);
      if (Array.isArray(nodes)) {
        return nodes.filter(n => typeof n === 'string' && n.startsWith('enode://'));
      }
    }
  } catch (err) {
    console.error('Error loading static-nodes.json:', err.message);
  }
  return [];
}

/**
 * Save enodes to static-nodes.json
 * @param {Array<string>} enodes
 */
function saveStaticNodes(enodes) {
  const content = JSON.stringify(enodes, null, 2) + '\n';
  fs.writeFileSync(STATIC_NODES_PATH, content, 'utf8');
}

/**
 * Remove duplicate enodes by ID
 * @param {Array<string>} enodes
 * @returns {Array<string>}
 */
function deduplicateEnodes(enodes) {
  const seen = new Set();
  return enodes.filter(enode => {
    const parsed = parseEnode(enode);
    if (parsed) {
      const key = parsed.id.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    }
    return false;
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldUpdate = args.includes('--update');
  const checkNew = args.includes('--check-new');

  console.log('='.repeat(70));
  console.log('Enode Validator - Checking node connectivity');
  console.log('='.repeat(70));
  console.log('');

  // Load existing static nodes
  const existingEnodes = loadStaticNodes();
  console.log(`Loaded ${existingEnodes.length} enodes from static-nodes.json\n`);

  // Check existing enodes
  console.log('Checking existing enodes in static-nodes.json:');
  console.log('-'.repeat(70));

  const existingResults = [];
  for (const enode of existingEnodes) {
    const result = await checkEnode(enode);
    existingResults.push(result);
    const status = result.active ? '\x1b[32mACTIVE\x1b[0m' : '\x1b[31mINACTIVE\x1b[0m';
    const errorInfo = result.error ? ` (${result.error})` : '';
    console.log(`  [${status}] ${result.ip}:${result.port} (${result.id || 'invalid'})${errorInfo}`);
  }

  const activeExisting = existingResults.filter(r => r.active);
  const inactiveExisting = existingResults.filter(r => !r.active);

  console.log('');
  console.log(`Summary: ${activeExisting.length} active, ${inactiveExisting.length} inactive\n`);

  // Check new candidate enodes
  let activeNewEnodes = [];
  if (checkNew || shouldUpdate) {
    console.log('Checking new candidate enodes:');
    console.log('-'.repeat(70));

    for (const enode of NEW_CANDIDATE_ENODES) {
      const result = await checkEnode(enode);
      const status = result.active ? '\x1b[32mACTIVE\x1b[0m' : '\x1b[31mINACTIVE\x1b[0m';
      const errorInfo = result.error ? ` (${result.error})` : '';
      console.log(`  [${status}] ${result.ip}:${result.port} (${result.id || 'invalid'})${errorInfo}`);

      if (result.active) {
        activeNewEnodes.push(enode);
      }
    }

    console.log('');
    console.log(`New candidates: ${activeNewEnodes.length} active out of ${NEW_CANDIDATE_ENODES.length}\n`);
  }

  // Update static-nodes.json if requested
  if (shouldUpdate) {
    console.log('Updating static-nodes.json...');

    // Keep only active existing enodes
    const activeExistingEnodes = existingResults.filter(r => r.active).map(r => r.enode);

    // Combine with active new enodes
    let updatedEnodes = [...activeExistingEnodes, ...activeNewEnodes];

    // Remove duplicates
    updatedEnodes = deduplicateEnodes(updatedEnodes);

    // Save
    saveStaticNodes(updatedEnodes);

    console.log(`\nUpdated static-nodes.json with ${updatedEnodes.length} active enodes`);
    console.log(`  - Kept ${activeExistingEnodes.length} active existing enodes`);
    console.log(`  - Added ${activeNewEnodes.length} new active enodes`);
    console.log(`  - Removed ${inactiveExisting.length} inactive enodes`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
