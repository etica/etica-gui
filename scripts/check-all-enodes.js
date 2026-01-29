#!/usr/bin/env node
/**
 * Complete Enode Check Script
 * Checks all enodes: static-nodes.json + hardcoded in geth.js
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

const CONNECTION_TIMEOUT = 5000;
const STATIC_NODES_PATH = path.join(__dirname, '..', 'needs', 'static-nodes.json');

// Hardcoded mainnet enodes from geth.js (verified active as of 2026-01-28)
const MAINNET_ENODES = [
  "enode://b0e97d2f1a37b2035a34b97f32fb31ddd93ae822b603c56b7f17cfb189631ea2ef17bfbed904f8bc564765634f2d9db0a128835178c8af9f1dde68ee6b5e2bf7@167.172.47.195:30303",
  "enode://363a353e050862630ea27807c454eb118d5893600ea0cc1aa66fcdf427d0da458da50d5ac4c43b95205acaa2c21b949f7f1000158a2a63819926f71571172356@142.93.138.113:30303",
  "enode://7f2d5370b11c604f348da0ce62ad21aafa32cf7136c94496dbf39bf261e6c317dea25e41dfc20894f89e30c4a4b1a76f52e3742fffd77c690f8d5e1c3ae1c2b4@62.72.177.101:30310",
  "enode://44024f1df7351de1e0de9484f9289cc49255ed8dea626acf18e8fe70fa87e42f7202e52c048a8ff24bebf0cb5cb5d97eaf3557bb6a32d9724f0a205b1dfea6d4@62.72.177.101:30303",
  "enode://05e849326b412dd1c22886a246f71f87268410724623e0defa93a7d658fae4ae2bcdf249c3044292062224d322834e39161649b2fcb879d8455f567e3213113a@62.72.177.101:30303",
  "enode://7deed4aa7e35420266ee09c11f0040c66977f86a85d8e45403215651974d0e0f491d0426c82dce96ccdb361d8b0431592eb591ecb7a66af5f950a2e539ceb0e5@156.67.29.122:30303",
  "enode://c74c0784a05533722cdbd10c4ebd99fc9effaf13b180f146183899ee380e7e30ea3f4da00454780d114408d0fe48856d99013473f6034730912e0b97fde3c4e4@128.199.38.119:30303",
  "enode://72626a3059948842b1b978bbdb7abc1e7427ace2cb7d94a719b4b1d114d4c57dbabb35b7270feb11c64d0d04f3a1a121624523b15efaf006c96b4c2e38fb35b1@167.86.96.115:30317",
  "enode://363a411c017a8a1413b1c8b96cb15340f871973d20c5d7436f5f771c8cd52ad4a55e2b634d866e02796aae70bef0b26c6c3aefdb8d1caab6c61ee378aebaf65d@46.101.129.218:30303",
  "enode://2d49074560bb529f6e21f1f4218ab51e0ded6528e27c1f7f9abec0f2b388bbb45a6b6f8ad16c287fa8e509e2c0c59b0d6778bcd8ec842ca0c745672cea568e4c@77.57.208.155:30303",
  "enode://68f47b809269209d4248356f4d5f0b618f2afd5f0db3f063eb5aca9c9fffefaa894ce87a64a13cee594bcb67c2f73d3a22da3ba7414b761afc73f6f230c28cf3@149.50.110.33:30303"
];

// New candidate enodes
const NEW_CANDIDATE_ENODES = [
  "enode://7f2d5370b11c604f348da0ce62ad21aafa32cf7136c94496dbf39bf261e6c317dea25e41dfc20894f89e30c4a4b1a76f52e3742fffd77c690f8d5e1c3ae1c2b4@62.72.177.101:30310",
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

function parseEnode(enode) {
  const match = enode.match(/enode:\/\/([a-fA-F0-9]+)@([^:]+):(\d+)/);
  if (match) {
    return { id: match[1], ip: match[2], port: parseInt(match[3], 10), full: enode };
  }
  return null;
}

function checkConnection(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    const cleanup = () => { if (!resolved) { resolved = true; socket.destroy(); } };
    socket.setTimeout(CONNECTION_TIMEOUT);
    socket.on('connect', () => { cleanup(); resolve(true); });
    socket.on('timeout', () => { cleanup(); resolve(false); });
    socket.on('error', () => { cleanup(); resolve(false); });
    socket.connect(port, ip);
  });
}

async function checkEnode(enode) {
  const parsed = parseEnode(enode);
  if (!parsed) return { enode, active: false, error: 'Invalid format' };
  if (parsed.ip.startsWith('192.168.') || parsed.ip.startsWith('10.') || parsed.ip.startsWith('172.16.')) {
    return { enode, active: false, ip: parsed.ip, port: parsed.port, error: 'Private IP' };
  }
  const active = await checkConnection(parsed.ip, parsed.port);
  return { enode, active, ip: parsed.ip, port: parsed.port, id: parsed.id.substring(0, 16) + '...' };
}

function loadStaticNodes() {
  try {
    if (fs.existsSync(STATIC_NODES_PATH)) {
      const content = fs.readFileSync(STATIC_NODES_PATH, 'utf8');
      const nodes = JSON.parse(content);
      if (Array.isArray(nodes)) return nodes.filter(n => typeof n === 'string' && n.startsWith('enode://'));
    }
  } catch (err) { console.error('Error loading static-nodes.json:', err.message); }
  return [];
}

function deduplicateEnodes(enodes) {
  const seen = new Set();
  return enodes.filter(enode => {
    const parsed = parseEnode(enode);
    if (parsed) {
      const key = parsed.id.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
    return false;
  });
}

async function checkList(name, enodes) {
  console.log(`\n${name}:`);
  console.log('-'.repeat(70));
  const results = [];
  for (const enode of enodes) {
    const result = await checkEnode(enode);
    results.push(result);
    const status = result.active ? '\x1b[32mACTIVE\x1b[0m' : '\x1b[31mINACTIVE\x1b[0m';
    const errorInfo = result.error ? ` (${result.error})` : '';
    console.log(`  [${status}] ${result.ip}:${result.port} (${result.id || 'invalid'})${errorInfo}`);
  }
  const active = results.filter(r => r.active);
  console.log(`  => ${active.length}/${results.length} active`);
  return results;
}

async function main() {
  console.log('='.repeat(70));
  console.log('Complete Enode Check - All Sources');
  console.log('='.repeat(70));

  const staticNodes = loadStaticNodes();

  const staticResults = await checkList(`Static-nodes.json (${staticNodes.length} enodes)`, staticNodes);
  const mainnetResults = await checkList(`Hardcoded Mainnet (${MAINNET_ENODES.length} enodes)`, MAINNET_ENODES);
  const newResults = await checkList(`New Candidates (${NEW_CANDIDATE_ENODES.length} enodes)`, NEW_CANDIDATE_ENODES);

  // Collect all active enodes
  const allActiveEnodes = [
    ...staticResults.filter(r => r.active).map(r => r.enode),
    ...mainnetResults.filter(r => r.active).map(r => r.enode),
    ...newResults.filter(r => r.active).map(r => r.enode)
  ];

  const uniqueActive = deduplicateEnodes(allActiveEnodes);

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Static-nodes.json: ${staticResults.filter(r => r.active).length}/${staticResults.length} active`);
  console.log(`Hardcoded Mainnet: ${mainnetResults.filter(r => r.active).length}/${mainnetResults.length} active`);
  console.log(`New Candidates:    ${newResults.filter(r => r.active).length}/${newResults.length} active`);
  console.log(`\nTotal unique active enodes: ${uniqueActive.length}`);

  console.log('\n' + '='.repeat(70));
  console.log('RECOMMENDED static-nodes.json (active enodes only):');
  console.log('='.repeat(70));
  console.log(JSON.stringify(uniqueActive, null, 2));

  // Option to update
  if (process.argv.includes('--update')) {
    fs.writeFileSync(STATIC_NODES_PATH, JSON.stringify(uniqueActive, null, 2) + '\n');
    console.log(`\n\x1b[32mUpdated static-nodes.json with ${uniqueActive.length} active enodes!\x1b[0m`);
  } else {
    console.log('\nRun with --update to save these to static-nodes.json');
  }
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
