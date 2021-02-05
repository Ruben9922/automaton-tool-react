import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import State from "./state";
import Transition from "./transition";
import { findStateById } from "./utilities";

interface TransitionFunctionKey {
  currentState: State;
  symbol: string;
}

// TODO: Replace with interface and factory function (?)
export default class Automaton {
  id: string;
  alphabet: string[];
  states: State[];
  transitionFunction: Map<TransitionFunctionKey, State[]>;
  initialState: State;
  finalStates: State[];

  constructor(
    alphabet: string[],
    states: State[],
    transitionFunction: Map<TransitionFunctionKey, State[]>,
    initialState: State,
    finalStates: State[],
  ) {
    this.id = uuidv4();
    this.alphabet = alphabet;
    this.states = states;
    this.transitionFunction = transitionFunction;
    this.initialState = initialState;
    this.finalStates = finalStates;
  }

  // TODO: States in the automaton do not need to contain IDs
  static createAutomaton = (
    alphabet: string[],
    states: State[],
    transitions: Transition[],
    initialStateId: string,
    finalStateIds: string[],
  ): Automaton => (
    new Automaton(
      alphabet,
      states,
      Automaton.transitionsToTransitionFunction(transitions, states),
      findStateById(states, initialStateId) as State,
      states.filter((s) => finalStateIds.includes(s.id)),
    )
  );

  static transitionsToTransitionFunction =
    (transitions: Transition[], states: State[]): Map<TransitionFunctionKey, State[]> => {
      // Using type assertions to exclude undefined because state can never be undefined due to the
      // logic of the application
      const transitionFunction = new Map(R.map((t) => [
        { currentState: findStateById(states, t.currentState) as State, symbol: t.symbol },
        R.map((s) => findStateById(states, s) as State, t.nextStates),
      ], transitions));

      return transitionFunction;
    };
}
