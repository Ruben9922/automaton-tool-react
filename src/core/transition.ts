export default interface Transition {
  id: string;
  currentState: string;
  symbol: string | null;
  nextStates: string[];
}

export function createTransitionFunctionKey(currentState: string, symbol: string | null) {
  return `TransitionFunctionKey(currentStateId=${currentState}, symbol=${symbol})`;
}
