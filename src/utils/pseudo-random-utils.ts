import { createHash } from 'crypto';

/**
 * Pseudo-random number generation utilities
 */
export type RandomAlgorithm = 'xoshiro256pp' | 'pcg64';
export type BiasType = 'slight_up' | 'moderate_up' | 'none' | 'slight_down' | 'moderate_down';

export interface RandomOptions {
  algorithm?: RandomAlgorithm;
  bias?: BiasType | number;
  seed?: string;
}

export function random(seed: string, options: RandomOptions = {}): number {
  const generator = createGenerator(seed, options);
  return generator();
}

export function randomInt(
  min: number,
  max: number,
  seed: string = '',
  options: RandomOptions = {}
): number {
  const value = seed.length > 0 ? random(seed, options) : Math.random();
  return Math.floor(value * (max - min + 1)) + min;
}

export function randomFloat(
  min: number,
  max: number,
  seed: string = '',
  options: RandomOptions = {}
): number {
  const value = seed.length > 0 ? random(seed, options) : Math.random();
  return value * (max - min) + min;
}

export function randomBool(
  seed: string,
  probability: number = 0.5,
  options: RandomOptions = {}
): boolean {
  return (seed.length > 0 ? random(seed, options) : Math.random()) < probability;
}

export function randomChoice<T>(
  array: T[] | readonly T[],
  seed: string = '',
  options: RandomOptions = {}
): T {
  const index = Math.floor(
    seed.length > 0 ? random(seed, options) * array.length : Math.random() * array.length
  );
  return array[index];
}

export function createGenerator(seed: string, options: RandomOptions): () => number {
  const { algorithm = 'xoshiro256pp', bias = 'none' } = options;

  let baseGenerator: () => number;

  switch (algorithm) {
    case 'xoshiro256pp':
      baseGenerator = createXoshiro256ppGenerator(seed);
      break;
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }

  return applyBias(baseGenerator, bias);
}

function createXoshiro256ppGenerator(seed: string): () => number {
  const hash = createHash('sha256').update(seed).digest();
  let s0 = BigInt(hash.readBigUInt64BE(0));
  let s1 = BigInt(hash.readBigUInt64BE(8));
  let s2 = BigInt(hash.readBigUInt64BE(16));
  let s3 = BigInt(hash.readBigUInt64BE(24));

  if (s0 === 0n && s1 === 0n && s2 === 0n && s3 === 0n) {
    s0 = 1n;
  }

  const rotl = (x: bigint, k: number): bigint => {
    return (x << BigInt(k)) | (x >> BigInt(64 - k));
  };

  return () => {
    const result = rotl(s0 + s3, 23) + s0;
    const t = s1 << 17n;

    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;

    s2 ^= t;

    s3 = rotl(s3, 45);

    return Number(result & ((1n << 64n) - 1n)) / Number(1n << 64n);
  };
}

export function applyBias(generator: () => number, bias: BiasType | number): () => number {
  let power: number;

  if (typeof bias === 'number') {
    power = 1 + Math.max(-1, Math.min(1, bias));
  } else {
    switch (bias) {
      case 'slight_up':
        power = 0.7;
        break;
      case 'moderate_up':
        power = 0.5;
        break;
      case 'slight_down':
        power = 1.3;
        break;
      case 'moderate_down':
        power = 1.5;
        break;
      case 'none':
      default:
        power = 1;
        break;
    }
  }

  if (power === 1) return generator;

  return () => {
    const x = generator();
    return power < 1 ? Math.pow(x, power) : 1 - Math.pow(1 - x, 1 / power);
  };
}
