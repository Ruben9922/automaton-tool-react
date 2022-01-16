import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import State, { stateIdToStateName, stateNameToStateId } from "./state";
import Transition from "./transition";

type TransitionFunction = Map<string, {
  currentState: string,
  symbol: string | null,
  nextStates: string[],
}>;

export function transitionsToTransitionFunction(
  transitions: Transition[],
  states: State[],
): TransitionFunction {
  // Using type assertions to exclude undefined because state can never be undefined due to the
  // logic of the application
  return new Map(
    R.map((t: Transition) => [
      createTransitionFunctionKey(stateIdToStateName(t.currentState, states), t.symbol),
      {
        currentState: stateIdToStateName(t.currentState, states),
        symbol: t.symbol,
        nextStates: R.map((nextStateId) => stateIdToStateName(nextStateId, states), t.nextStates),
      },
    ], transitions),
  );
}

export function transitionFunctionToTransitions(
  transitionFunction: TransitionFunction,
  states: State[],
): Transition[] {
  return R.map((o) => ({
    id: uuidv4(),
    currentState: stateNameToStateId(o.currentState, states),
    symbol: o.symbol,
    nextStates: R.map((nextStateName) => stateNameToStateId(nextStateName, states), o.nextStates),
  }), Array.from(transitionFunction.values()));
}

export function createTransitionFunctionKey(currentState: string, symbol: string | null) {
  return `currentState=${currentState}, symbol=${symbol ?? "null"}`;
}

export default TransitionFunction;
