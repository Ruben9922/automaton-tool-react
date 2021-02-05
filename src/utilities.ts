import * as R from "ramda";
import State from "./state";

export function findStateById(states: State[], id: string): State | undefined {
  return R.find((state) => state.id === id, states);
}

// TODO: Could also use R.without() (?)
export function isUnique<T>(p: (s1: T, s2: T) => boolean, l: T[]) {
  return R.map((s1) => R.equals(1, R.length(R.filter(R.partial(p, [s1]), l))), l);
}

export const isSubset: <T>(l1: T[], l2: T[]) => boolean = R.uncurryN(2, R.pipe(R.without, R.empty));
