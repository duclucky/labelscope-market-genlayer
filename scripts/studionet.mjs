import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { ExecutionResult, TransactionStatus } from 'genlayer-js/types';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CONTRACT_PATH = path.join(REPO, 'contracts', 'labelscope_market.py');
const EVIDENCE_DIR = path.join(REPO, 'docs', 'evidence', 'studionet');
const DEPLOYMENT_PATH = path.join(EVIDENCE_DIR, 'deployment.json');
const LIFECYCLE_PATH = path.join(EVIDENCE_DIR, 'lifecycle.json');
const EXPLORER = 'https://explorer-studio.genlayer.com';
const WEI = 10n ** 18n;
const STAKE = WEI / 1000n;

export function parseEnvText(text) {
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    result[match[1]] = value;
  }
  return result;
}

export function extractContractAddress(receipt) {
  return String(
    receipt?.contract_address ??
      receipt?.contractAddress ??
      receipt?.txDataDecoded?.contractAddress ??
      receipt?.data?.contract_address ??
      receipt?.data?.contractAddress ??
      '',
  );
}

export function safeReceipt(receipt) {
  return {
    txHash: String(receipt?.hash ?? receipt?.txId ?? receipt?.transaction_hash ?? ''),
    status: String(receipt?.statusName ?? receipt?.status ?? ''),
    executionResult: String(
      receipt?.txExecutionResultName ?? receipt?.execution_result?.status ?? receipt?.execution_result ?? '',
    ),
    contractAddress: extractContractAddress(receipt),
  };
}

export function selectMarketId(address) {
  return `jideytro-20260722-${address.toLowerCase().slice(2, 10)}`;
}

function loadEnvironment() {
  const files = [path.join(REPO, '.env'), path.resolve(REPO, '..', '.env')];
  const loaded = {};
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const parsed = parseEnvText(fs.readFileSync(file, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in loaded) && value !== '') loaded[key] = value;
    }
  }
  return { ...loaded, ...process.env };
}

function requireKey(value, name) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value ?? '')) {
    throw new Error(`${name} is missing or invalid in project or parent .env.`);
  }
  return value;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sourceIdentity() {
  const source = fs.readFileSync(CONTRACT_PATH, 'utf8');
  const depends = source.split(/\r?\n/, 1)[0];
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim();
  let committedSource;
  try {
    committedSource = execFileSync('git', ['show', `HEAD:contracts/labelscope_market.py`], {
      cwd: REPO,
      encoding: 'utf8',
    });
  } catch {
    throw new Error('Commit the verified contract source before deployment.');
  }
  if (sha256(Buffer.from(source.replaceAll('\r\n', '\n'))) !== sha256(Buffer.from(committedSource.replaceAll('\r\n', '\n')))) {
    throw new Error('Contract source differs from HEAD; commit the verified source before deployment.');
  }
  return { source, commit, contractSha256: sha256(source), depends };
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
}

function nowIso() {
  return new Date().toISOString();
}

function explorerTx(hash) {
  return `${EXPLORER}/transactions/${hash}`;
}

function explorerAddress(address) {
  return `${EXPLORER}/address/${address}`;
}

function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/0x[0-9a-fA-F]{64}/g, '[redacted-hex]').slice(0, 500);
}

function publicLog(event, data = {}) {
  process.stdout.write(`${JSON.stringify({ event, ...data })}\n`);
}

function clients() {
  const env = loadEnvironment();
  const primary = createAccount(requireKey(env.STUDIONET_PRIVATE_KEY, 'STUDIONET_PRIVATE_KEY'));
  const integrator = createAccount(
    requireKey(env.STUDIONET_INTEGRATOR_PRIVATE_KEY, 'STUDIONET_INTEGRATOR_PRIVATE_KEY'),
  );
  return {
    primary,
    integrator,
    read: createClient({ chain: studionet }),
    primaryClient: createClient({ chain: studionet, account: primary }),
    integratorClient: createClient({ chain: studionet, account: integrator }),
  };
}

async function accountSnapshot(read, account) {
  const balance = await read.getBalance({ address: account.address });
  return { address: account.address, balanceWei: balance.toString() };
}

async function inspectNetwork() {
  const { read, primary, integrator } = clients();
  const chainId = await read.getChainId();
  const [primarySnapshot, integratorSnapshot] = await Promise.all([
    accountSnapshot(read, primary),
    accountSnapshot(read, integrator),
  ]);
  const deployment = readJson(DEPLOYMENT_PATH);
  let contractSummary = null;
  if (deployment?.address) {
    contractSummary = await read.readContract({
      address: deployment.address,
      functionName: 'get_contract_summary',
      args: [],
      jsonSafeReturn: true,
    });
  }
  publicLog('inspect', {
    network: 'studionet',
    chainId,
    primary: primarySnapshot,
    integrator: integratorSnapshot,
    deployment: deployment
      ? { address: deployment.address ?? '', status: deployment.status, txHash: deployment.txHash }
      : null,
    contractSummary,
  });
}

function assertSuccessful(receipt, action) {
  if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
    throw new Error(`${action} finalized without successful execution (${receipt.txExecutionResultName ?? 'unknown'}).`);
  }
}

async function waitFinalized(read, hash, action) {
  const accepted = await read.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 600,
  });
  publicLog('accepted', { action, txHash: hash, status: accepted.statusName ?? accepted.status, explorer: explorerTx(hash) });
  const finalized = await read.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    interval: 3000,
    retries: 600,
  });
  assertSuccessful(finalized, action);
  publicLog('finalized', {
    action,
    txHash: hash,
    status: finalized.statusName ?? finalized.status,
    executionResult: finalized.txExecutionResultName,
    explorer: explorerTx(hash),
  });
  return { acceptedAt: nowIso(), finalizedAt: nowIso(), receipt: finalized };
}

async function sendAndRecord({ read, client, actor, address, action, functionName, args = [], value = 0n, state }) {
  const hash = await client.writeContract({ address, functionName, args, value });
  state.transactions ??= [];
  const record = {
    action,
    actor: actor.address,
    txHash: hash,
    explorer: explorerTx(hash),
    submittedAt: nowIso(),
    status: 'SUBMITTED',
  };
  state.transactions.push(record);
  writeJson(LIFECYCLE_PATH, state);
  publicLog('submitted', { action, actor: actor.address, txHash: hash, explorer: record.explorer });
  const result = await waitFinalized(read, hash, action);
  Object.assign(record, {
    acceptedAt: result.acceptedAt,
    finalizedAt: result.finalizedAt,
    status: result.receipt.statusName ?? String(result.receipt.status ?? ''),
    executionResult: result.receipt.txExecutionResultName,
  });
  writeJson(LIFECYCLE_PATH, state);
  return result.receipt;
}

async function deploy() {
  const identity = sourceIdentity();
  const { read, primary, primaryClient } = clients();
  const existing = readJson(DEPLOYMENT_PATH);
  if (existing?.address) {
    if (existing.contractSha256 !== identity.contractSha256) {
      throw new Error('An active deployment exists for a different contract source hash. Archive it before replacement.');
    }
    const summary = await read.readContract({
      address: existing.address,
      functionName: 'get_contract_summary',
      args: [],
      jsonSafeReturn: true,
    });
    publicLog('deployment-reused', { address: existing.address, explorer: explorerAddress(existing.address), summary });
    return existing;
  }

  let pending = existing;
  if (!pending?.txHash) {
    const txHash = await primaryClient.deployContract({ code: identity.source, args: [] });
    pending = {
      network: 'studionet',
      chainId: 61999,
      status: 'SUBMITTED',
      txHash,
      explorer: explorerTx(txHash),
      deployer: primary.address,
      submittedAt: nowIso(),
      sourceCommit: identity.commit,
      contractSha256: identity.contractSha256,
      depends: identity.depends,
      sdk: 'genlayer-js@1.1.8',
    };
    writeJson(DEPLOYMENT_PATH, pending);
    publicLog('deployment-submitted', { txHash, deployer: primary.address, explorer: pending.explorer });
  } else if (pending.contractSha256 !== identity.contractSha256) {
    throw new Error('Pending deployment belongs to a different contract source hash.');
  }

  const result = await waitFinalized(read, pending.txHash, 'deploy');
  const address = extractContractAddress(result.receipt);
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error('Deployment finalized successfully but no contract address was present in the decoded receipt.');
  }
  const summary = await read.readContract({
    address,
    functionName: 'get_contract_summary',
    args: [],
    jsonSafeReturn: true,
  });
  const complete = {
    ...pending,
    status: result.receipt.statusName ?? String(result.receipt.status ?? ''),
    executionResult: result.receipt.txExecutionResultName,
    acceptedAt: result.acceptedAt,
    finalizedAt: result.finalizedAt,
    address,
    contractExplorer: explorerAddress(address),
    canonicalSummary: summary,
  };
  writeJson(DEPLOYMENT_PATH, complete);
  publicLog('deployment-complete', { address, explorer: complete.contractExplorer, summary });
  return complete;
}

function isoAfter(milliseconds) {
  return new Date(Date.now() + milliseconds).toISOString().replace('.000Z', 'Z');
}

async function sleepUntil(iso, label) {
  while (Date.now() < Date.parse(iso) + 1500) {
    const seconds = Math.max(1, Math.ceil((Date.parse(iso) + 1500 - Date.now()) / 1000));
    publicLog('waiting', { for: label, secondsRemaining: seconds });
    await new Promise((resolve) => setTimeout(resolve, Math.min(seconds * 1000, 30000)));
  }
}

async function lifecycle() {
  const deployment = await deploy();
  const { read, primary, integrator, primaryClient, integratorClient } = clients();
  const address = deployment.address;
  const marketId = selectMarketId(address);
  const state = readJson(LIFECYCLE_PATH, {
    network: 'studionet',
    chainId: 61999,
    contractAddress: address,
    contractExplorer: explorerAddress(address),
    marketId,
    startedAt: nowIso(),
    transactions: [],
  });
  if (state.contractAddress !== address || state.marketId !== marketId) {
    throw new Error('Lifecycle evidence belongs to another deployment. Archive it before proceeding.');
  }

  let ids = await read.readContract({ address, functionName: 'get_market_ids', args: [], jsonSafeReturn: true });
  if (!Array.isArray(ids)) throw new Error('Canonical market index is not an array.');
  if (!ids.map(String).includes(marketId)) {
    const closeAt = isoAfter(8 * 60 * 1000);
    const resolveAt = isoAfter(10 * 60 * 1000);
    const refundAt = isoAfter(25 * 60 * 1000);
    state.terms = { closeAt, resolveAt, refundAt };
    writeJson(LIFECYCLE_PATH, state);
    await sendAndRecord({
      read,
      client: primaryClient,
      actor: primary,
      address,
      action: 'create_market',
      functionName: 'create_market',
      args: [
        marketId,
        'Will the exact FDA label match the locked Jideytro approval scope?',
        'FDA_LABEL_SCOPE',
        'Jideytro (zidesamtinib)',
        'NDA220185',
        '3760e421-b523-4d9b-e063-6394a90ab94b',
        '20260722',
        'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-zidesamtinib-ros1-positive-non-small-cell-lung-cancer',
        'non-small cell lung cancer',
        'ROS1-positive',
        'adults',
        'locally advanced or metastatic',
        'received a prior ROS1 kinase inhibitor',
        'NOT_REQUIRED',
        'FDA approval',
        closeAt,
        resolveAt,
        refundAt,
      ],
      state,
    });
  }

  let market = await read.readContract({ address, functionName: 'get_market', args: [marketId], jsonSafeReturn: true });
  state.terms ??= { closeAt: market.close_at, resolveAt: market.resolve_at, refundAt: market.refund_at };
  if (BigInt(market.yes_total) === 0n && market.status === 'OPEN') {
    await sendAndRecord({ read, client: primaryClient, actor: primary, address, action: 'fund_yes', functionName: 'fund_position', args: [marketId, 'YES'], value: STAKE, state });
  }
  market = await read.readContract({ address, functionName: 'get_market', args: [marketId], jsonSafeReturn: true });
  if (BigInt(market.no_total) === 0n && market.status === 'OPEN') {
    await sendAndRecord({ read, client: integratorClient, actor: integrator, address, action: 'fund_no', functionName: 'fund_position', args: [marketId, 'NO'], value: STAKE, state });
  }

  market = await read.readContract({ address, functionName: 'get_market', args: [marketId], jsonSafeReturn: true });
  if (market.status === 'OPEN') {
    await sleepUntil(market.close_at, 'funding close');
    await sendAndRecord({ read, client: primaryClient, actor: primary, address, action: 'lock_market', functionName: 'lock_market', args: [marketId], state });
  }
  market = await read.readContract({ address, functionName: 'get_market', args: [marketId], jsonSafeReturn: true });
  if (market.status === 'LOCKED') {
    await sleepUntil(market.resolve_at, 'resolution eligibility');
    await sendAndRecord({ read, client: primaryClient, actor: primary, address, action: 'resolve_market', functionName: 'resolve_market', args: [marketId], state });
  }

  market = await read.readContract({ address, functionName: 'get_market', args: [marketId], jsonSafeReturn: true });
  if (market.status === 'RETRYABLE') {
    const attemptCount = Number(market.attempt_count);
    const attempt = await read.readContract({ address, functionName: 'get_attempt', args: [marketId, attemptCount], jsonSafeReturn: true });
    state.retryableAttempt = attempt;
    writeJson(LIFECYCLE_PATH, state);
    throw new Error(`Resolution is retryable at source stage ${attempt.source_stage}; inspect evidence before retrying.`);
  }
  if (!['RESOLVED_YES', 'RESOLVED_NO'].includes(market.status)) {
    throw new Error(`Unexpected canonical market status after resolution: ${market.status}`);
  }

  const winner = market.status === 'RESOLVED_YES' ? { actor: primary, client: primaryClient } : { actor: integrator, client: integratorClient };
  let winnerPosition = await read.readContract({ address, functionName: 'get_position', args: [marketId, winner.actor.address], jsonSafeReturn: true });
  if (!winnerPosition.claimed) {
    await sendAndRecord({ read, client: winner.client, actor: winner.actor, address, action: 'claim_credit', functionName: 'claim_credit', args: [marketId], state });
  }
  const creditBefore = BigInt(await read.readContract({ address, functionName: 'get_credit', args: [winner.actor.address], jsonSafeReturn: true }));
  const balanceBefore = await read.getBalance({ address: winner.actor.address });
  if (creditBefore > 0n) {
    await sendAndRecord({ read, client: winner.client, actor: winner.actor, address, action: 'withdraw_credit', functionName: 'withdraw_credit', args: [creditBefore], state });
  }
  const [creditAfter, balanceAfter, summary, attemptCount] = await Promise.all([
    read.readContract({ address, functionName: 'get_credit', args: [winner.actor.address], jsonSafeReturn: true }),
    read.getBalance({ address: winner.actor.address }),
    read.readContract({ address, functionName: 'get_contract_summary', args: [], jsonSafeReturn: true }),
    read.readContract({ address, functionName: 'get_attempt_count', args: [marketId], jsonSafeReturn: true }),
  ]);
  market = await read.readContract({ address, functionName: 'get_market', args: [marketId], jsonSafeReturn: true });
  winnerPosition = await read.readContract({ address, functionName: 'get_position', args: [marketId, winner.actor.address], jsonSafeReturn: true });
  state.completedAt = nowIso();
  state.canonical = {
    market,
    winnerPosition,
    attemptCount: Number(attemptCount),
    winner: winner.actor.address,
    creditBeforeWei: creditBefore.toString(),
    creditAfterWei: String(creditAfter),
    winnerBalanceBeforeWithdrawWei: balanceBefore.toString(),
    winnerBalanceAfterWithdrawWei: balanceAfter.toString(),
    contractSummary: summary,
  };
  writeJson(LIFECYCLE_PATH, state);
  publicLog('lifecycle-complete', {
    marketId,
    status: market.status,
    verdict: market.verdict,
    consequenceClass: market.consequence_class,
    winner: winner.actor.address,
    creditBeforeWei: creditBefore.toString(),
    creditAfterWei: String(creditAfter),
    contractSummary: summary,
  });
}

async function main() {
  const command = process.argv[2] ?? 'inspect';
  if (command === 'inspect') return inspectNetwork();
  if (command === 'deploy') return deploy();
  if (command === 'lifecycle' || command === 'all') return lifecycle();
  throw new Error('Usage: node scripts/studionet.mjs [inspect|deploy|lifecycle|all]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${JSON.stringify({ event: 'error', message: sanitizeError(error) })}\n`);
    process.exitCode = 1;
  });
}
