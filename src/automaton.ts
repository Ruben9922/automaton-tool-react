import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import { InputState } from "./Input";
import TransitionFunction, {
  transitionFunctionToTransitions,
  transitionsToTransitionFunction
} from "./transitionFunction";

// TODO: Replace with interface and factory function (?)
export default class Automaton {
  name: string;
  alphabet: string[];
  states: string[];
  transitionFunction: TransitionFunction;
  initialState: string;
  finalStates: string[];

  constructor(
    name: string,
    alphabet: string[],
    states: string[],
    transitionFunction: TransitionFunction,
    initialState: string,
    finalStates: string[],
  ) {
    this.name = name;
    this.alphabet = alphabet;
    this.states = states;
    this.transitionFunction = transitionFunction;
    this.initialState = initialState;
    this.finalStates = finalStates;
  }

  static fromInputState(inputState: Omit<InputState, "alphabetPresetIndex">, index: number): Automaton {
    return new Automaton(
      inputState.name || Automaton.generatePlaceholderName(index),
      inputState.alphabet,
      Array.from(inputState.states.values()),
      transitionsToTransitionFunction(inputState.transitions, inputState.states),
      inputState.states.get(inputState.initialStateId)!,
      R.map((id) => inputState.states.get(id)!, inputState.finalStateIds),
    );
  }

  toInputState(): Omit<InputState, "alphabetPresetIndex"> {
    // Generate a UUID for each of the states
    // Store this as a list of objects
    const l = R.map((s: string) => ({
      name: s,
      id: uuidv4(),
    }), this.states);

    // Based on this list of objects, create maps mapping from state IDs to state names and vice versa
    const states = new Map(R.map((o) => [o.id, o.name], l));
    const stateIds = new Map(R.map((o) => [o.name, o.id], l));

    return {
      name: this.name,
      alphabet: this.alphabet,
      states,
      transitions: transitionFunctionToTransitions(this.transitionFunction, stateIds),
      initialStateId: stateIds.get(this.initialState)!,
      finalStateIds: R.map((state) => stateIds.get(state)!, this.finalStates),
    };
  }

  // TODO: See if typing can be improved
  toDb(): any {
    return {
      name: this.name,
      alphabet: this.alphabet,
      states: this.states,
      transitionFunction: Object.fromEntries(this.transitionFunction),
      initialState: this.initialState,
      finalStates: this.finalStates,
    };
  }

  static fromDb(value: any): Automaton {
    return new Automaton(
      value.name,
      value.alphabet ?? [],
      value.states ?? [],
      value.transitionFunction ? new Map(Object.entries(value.transitionFunction)) : new Map(),
      value.initialState,
      value.finalStates ?? [],
    );
  }

  static generatePlaceholderName(index: number): string {
    return `Automaton ${index + 1}`;
  }
}
