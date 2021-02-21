import * as R from "ramda";
import Transition from "./transition";
import TransitionFunctionKey from "./transitionFunctionKey";

type TransitionFunction = Map<string, {currentState: string, symbol: string, nextStates: string[]}>;

const createTransitionFunction = (transitions: Transition[], states: Map<string, string>): TransitionFunction => (
  // Using type assertions to exclude undefined because state can never be undefined due to the
  // logic of the application
  new Map(
    R.map((t: Transition) => [
      new TransitionFunctionKey(states.get(t.currentState)!, t.symbol).toString(),
      {
        currentState: states.get(t.currentState)!,
        symbol: t.symbol,
        nextStates: R.map((id) => states.get(id)!, t.nextStates),
      },
    ], transitions),
  )
);

// TODO: Replace with interface and factory function (?)
export default class Automaton {
  alphabet: string[];
  states: string[];
  transitionFunction: TransitionFunction;
  initialState: string;
  finalStates: string[];

  constructor(
    alphabet: string[],
    states: string[],
    transitionFunction: TransitionFunction,
    initialState: string,
    finalStates: string[],
  ) {
    this.alphabet = alphabet;
    this.states = states;
    this.transitionFunction = transitionFunction;
    this.initialState = initialState;
    this.finalStates = finalStates;
  }

  // TODO: States in the automaton do not need to contain IDs
  static createAutomaton = (
    alphabet: string[],
    states: Map<string, string>,
    transitions: Transition[],
    initialStateId: string,
    finalStateIds: string[],
  ): Automaton => (
    new Automaton(
      alphabet,
      Array.from(states.values()),
      createTransitionFunction(transitions, states),
      states.get(initialStateId)!,
      R.map((id) => states.get(id)!, finalStateIds),
    )
  );

  // static transitionFunctionToTransitions(transitionFunction: TransitionFunction): Transition[] {
  //   return Array.from(transitionFunction.values()).map((t) => ({
  //     id: uuidv4(), // TODO: not needed in database (?)
  //     currentState: t.currentState.id,
  //     symbol: t.symbol,
  //     nextStates: t.nextStates.map((s: State) => s.id),
  //   }));
  // }

  // TODO: See if typing can be improved
  toDb(): any {
    return {
      alphabet: this.alphabet,
      states: this.states,
      transitionFunction: Object.fromEntries(this.transitionFunction),
      initialState: this.initialState,
      finalStates: this.finalStates,
      timeAdded: Date.now(),
    };
  }

  static fromDb(value: any): Automaton {
    return new Automaton(
      value.alphabet ?? [],
      value.states ?? [],
      value.transitionFunction ? new Map(Object.entries(value.transitionFunction)) : new Map(),
      value.initialState,
      value.finalStates ?? [],
    );
  }
}
