import { getRedisValue, setRedisValue } from './redis.js';
import { CONSTANTS } from './constants.js';

const CIRCUIT_KEY = 'hanicar:circuit:openrouter';
const FAILURE_WINDOW_MS = 2 * 60 * 1000;
const OPEN_DURATION_MS = 60 * 1000;
const FAILURE_THRESHOLD = 5;

type CircuitState = {
  failures: number[];
  openUntil: number;
};

const memoryState: CircuitState = {
  failures: [],
  openUntil: 0,
};

function pruneFailures(failures: number[], now: number): number[] {
  return failures.filter((timestamp) => now - timestamp < FAILURE_WINDOW_MS);
}

function readMemoryState(now: number): CircuitState {
  memoryState.failures = pruneFailures(memoryState.failures, now);
  if (memoryState.openUntil > 0 && now >= memoryState.openUntil) {
    memoryState.openUntil = 0;
  }
  return memoryState;
}

async function readRedisState(now: number): Promise<CircuitState | null> {
  const raw = await getRedisValue(CIRCUIT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CircuitState;
    return {
      failures: pruneFailures(parsed.failures ?? [], now),
      openUntil: parsed.openUntil ?? 0,
    };
  } catch {
    return null;
  }
}

async function writeRedisState(state: CircuitState): Promise<void> {
  await setRedisValue(CIRCUIT_KEY, JSON.stringify(state), CONSTANTS.CIRCUIT_REDIS_TTL_SECONDS);
}

export async function isCircuitOpen(): Promise<boolean> {
  const now = Date.now();
  const redisState = await readRedisState(now);
  const state = redisState ?? readMemoryState(now);
  return state.openUntil > now;
}

export async function recordProviderFailure(): Promise<void> {
  const now = Date.now();
  const redisState = await readRedisState(now);
  const state = redisState ?? readMemoryState(now);

  state.failures = pruneFailures(state.failures, now);
  state.failures.push(now);

  if (state.failures.length >= FAILURE_THRESHOLD) {
    state.openUntil = now + OPEN_DURATION_MS;
    state.failures = [];
  }

  memoryState.failures = state.failures;
  memoryState.openUntil = state.openUntil;
  await writeRedisState(state);
}

export async function recordProviderSuccess(): Promise<void> {
  const now = Date.now();
  const state = readMemoryState(now);
  state.failures = [];
  state.openUntil = 0;
  memoryState.failures = [];
  memoryState.openUntil = 0;
  await writeRedisState(state);
}

export function resetCircuitForTests(): void {
  memoryState.failures = [];
  memoryState.openUntil = 0;
}
