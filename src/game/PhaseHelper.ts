export function getSummerLabPhase(): number {
  if (typeof window !== "undefined" && (window as any).__FORCE_SUMMER_LAB_PHASE !== undefined) {
    return (window as any).__FORCE_SUMMER_LAB_PHASE;
  }
  return Math.floor(Date.now() / 600000) % 4;
}
