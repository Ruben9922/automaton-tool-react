import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import { InputState } from "../component/Input";
import TransitionFunction, {
  transitionFunctionToTransitions,
  transitionsToTransitionFunction
} from "./transitionFunction";
import TransitionFunctionKey from "./transitionFunctionKey";
import {Run, RunTree, RunTreeNode} from "./run";

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
    const transitionFunction = value.transitionFunction
      ? new Map(Object.entries(value.transitionFunction))
      : new Map();

    for (const entry of transitionFunction) {
      if (entry[1].symbol === undefined) {
        entry[1].symbol = null;
      }
    }

    return new Automaton(
      value.name,
      value.alphabet ?? [],
      value.states ?? [],
      transitionFunction,
      value.initialState,
      value.finalStates ?? [],
    );
  }

  static generatePlaceholderName(index: number): string {
    return `Automaton ${index + 1}`;
  }

  computeEpsilonClosure(states: string[]): string[] {
    let closure = [...states];
    let changed: boolean;
    let newlyVisited = [...states];

    do {
      newlyVisited = R.chain((state1) => (
        this.transitionFunction.get(new TransitionFunctionKey(state1, null).toString())?.nextStates ?? []
      ), newlyVisited);
      const updatedClosure = R.union(closure, newlyVisited);
      changed = !R.equals(closure, updatedClosure);
      closure = updatedClosure;
    } while (changed);

    return closure;
  }

  run(input: string): Run {
    let currentStates = this.computeEpsilonClosure([this.initialState]);
    let visitedStates: Run = [
      {
        states: currentStates,
        symbol: null,
      },
    ];

    // TODO: Maybe rewrite using R.reduce
    // TODO: Maybe remove currentStates variable
    for (const symbol of input) {
      let nextStatesUnion = R.chain((state) => (
        this.transitionFunction.get(new TransitionFunctionKey(state, symbol).toString())?.nextStates ?? []
      ), currentStates);
      nextStatesUnion = this.computeEpsilonClosure(nextStatesUnion);

      currentStates = nextStatesUnion;
      visitedStates = R.append({
        states: currentStates,
        symbol,
      }, visitedStates);
    }

    return visitedStates;
  }

  runTree(input: string): RunTree {
    const createTree = (state: string, symbol: string | null): RunTreeNode => ({
      id: uuidv4(),
      state,
      symbol,
      children: [],
    });

    let roots = R.map(R.partialRight(createTree, [null]), this.computeEpsilonClosure([this.initialState]));
    let currentLevel = [...roots];

    for (const symbol of input) {
      let nextLevel: RunTreeNode[] = [];
      for (const node of currentLevel) {
        let nextStates = this.transitionFunction.get(new TransitionFunctionKey(node.state, symbol).toString())?.nextStates ?? [];
        nextStates = this.computeEpsilonClosure(nextStates);

        const newNodes = R.map(R.partialRight(createTree, [symbol]), nextStates);

        node.children = newNodes;

        nextLevel = [...nextLevel, ...newNodes];
      }
      currentLevel = nextLevel;
    }

    return roots;
  }

  accepts(run: Run): boolean {
    return !R.isEmpty(R.intersection(R.last(run)?.states ?? [], this.finalStates));
  }
}
