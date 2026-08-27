import type { GameTick } from "./types/simulation";

export function asGameTick(value: number): GameTick {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Game ticks must be non-negative integers.");
  }

  return value as GameTick;
}

export function nextGameTick(tick: GameTick): GameTick {
  const nextValue = tick + 1;
  return asGameTick(nextValue);
}
