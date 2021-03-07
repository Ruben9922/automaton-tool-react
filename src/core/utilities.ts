import * as R from "ramda";

export function computeStateIndex(states: Map<string, string>, id: string): number {
  return R.indexOf(id, Array.from(states.values()));
}

export function isUnique<T>(l: T[]): boolean {
  return R.equals(l, R.uniq(l));
}

// TODO: Could also use R.without() (?)
export function isUniqueList<T>(p: (s1: T, s2: T) => boolean, l: T[]) {
  return R.map((s1) => R.equals(1, R.length(R.filter(R.partial(p, [s1]), l))), l);
}

export const isSubset: <T>(l1: T[], l2: T[]) => boolean = R.uncurryN(2, R.pipe(R.without, R.empty));
