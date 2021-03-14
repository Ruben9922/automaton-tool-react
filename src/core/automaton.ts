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

  static flatten(states: string[]): string {
    return `{${states.join(", ")}}`;
  }

  determinize(): Automaton {
    const dfaInitialState = this.computeEpsilonClosure([this.initialState]);

    let dfaStatesFlattened: string[] = [];
    let dfaFinalStatesFlattened: string[] = [];
    const dfaTransitionFunction: TransitionFunction = new Map();

    let unexpandedDfaStates: string[][] = [];
    unexpandedDfaStates = R.append(dfaInitialState, unexpandedDfaStates);
    let expandedDfaStates: string[][] = [];

    while (!R.isEmpty(unexpandedDfaStates)) {
      // Pick any element from the unexpanded set and remove it
      const dfaCurrentState = R.head(unexpandedDfaStates)!;
      unexpandedDfaStates = R.tail(unexpandedDfaStates); // TODO: Think this is not necessary

      // Add it to the expanded set
      expandedDfaStates = R.union(expandedDfaStates, [dfaCurrentState]);

      // Note that flattening is done on-the-fly, therefore there is no full un-flattened version of the DFA
      const dfaCurrentStateFlattened = Automaton.flatten(dfaCurrentState);
      dfaStatesFlattened = R.union(dfaStatesFlattened, [dfaCurrentStateFlattened]);

      // Add the (flattened) DFA state to the (flattened) final states set if it is final
      // The DFA state is final if any of the contained NFA states is final
      const isFinalState = R.any(R.includes(R.__, this.finalStates), dfaCurrentState);
      if (isFinalState) {
        dfaFinalStatesFlattened = R.union(dfaFinalStatesFlattened, [dfaCurrentStateFlattened]);
      }

      for (const symbol of this.alphabet) {
        let dfaNextState = R.chain((nfaState) => this.transitionFunction.get(new TransitionFunctionKey(nfaState, symbol).toString())?.nextStates ?? [], dfaCurrentState);
        dfaNextState = this.computeEpsilonClosure(dfaNextState);

        // Add DFA state (flattened version)
        const dfaNextStateFlattened = Automaton.flatten(dfaNextState);
        dfaStatesFlattened = R.union(dfaStatesFlattened, [dfaNextStateFlattened]);

        // Add DFA transition - note its current and next states are the flattened versions
        dfaTransitionFunction.set(new TransitionFunctionKey(dfaCurrentStateFlattened, symbol).toString(), {
          currentState: dfaCurrentStateFlattened,
          symbol,
          nextStates: [dfaNextStateFlattened],
        });

        // Add next states ready to expanded in future iteration
        unexpandedDfaStates = R.union(unexpandedDfaStates, [dfaNextState]);
      }

      // Remove any expanded states from the unexpanded set
      // Needed as the computed DFA next state may be the same as one expanded previously
      unexpandedDfaStates = R.difference(unexpandedDfaStates, expandedDfaStates);
    }

    return new Automaton(
      `${this.name} [Determinised]`,
      this.alphabet,
      dfaStatesFlattened,
      dfaTransitionFunction,
      Automaton.flatten(dfaInitialState),
      dfaFinalStatesFlattened,
    );
  }
}
