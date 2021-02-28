import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import Transition from "./transition";
import TransitionFunctionKey from "./transitionFunctionKey";

type TransitionFunction = Map<string, {currentState: string, symbol: string | null, nextStates: string[]}>;

export function transitionsToTransitionFunction(
  transitions: Transition[],
  states: Map<string, string>,
): TransitionFunction {
  // Using type assertions to exclude undefined because state can never be undefined due to the
  // logic of the application
  return new Map(
    R.map((t: Transition) => [
      new TransitionFunctionKey(states.get(t.currentState)!, t.symbol).toString(),
      {
        currentState: states.get(t.currentState)!,
        symbol: t.symbol,
        nextStates: R.map((id) => states.get(id)!, t.nextStates),
      },
    ], transitions),
  );
}

export function transitionFunctionToTransitions(
  transitionFunction: TransitionFunction,
  stateIds: Map<string, string>,
): Transition[] {
  return R.map((o) => ({
    id: uuidv4(),
    currentState: stateIds.get(o.currentState)!,
    symbol: o.symbol,
    nextStates: R.map((s) => stateIds.get(s)!, o.nextStates),
  }), Array.from(transitionFunction.values()));
}

export default TransitionFunction;
