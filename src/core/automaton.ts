import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import { InputState } from "../component/Input";
import TransitionFunction, {
  transitionFunctionToTransitions,
  transitionsToTransitionFunction
} from "./transitionFunction";
import TransitionFunctionKey from "./transitionFunctionKey";
import {Run, RunTree, RunTreeNode} from "./run";
import {isSubset} from "./utilities";

// TODO: Replace with interface and factory function (?)
// TODO: Look into Immer with classes
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

  private computeEpsilonClosure(states: string[]): string[] {
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

  private static flatten(states: string[]): string {
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
      // TODO: Maybe replace with a map() at the end of the method
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

  // This doesn't take into account epsilon transitions as I only intend this to be run as part of DFA minimization
  private removeUnreachableStates(): Automaton {
    // TODO: Check if automaton is DFA / doesn't have epsilon transitions
    let reachableStates: string[] = [this.initialState];
    let unexpandedStates: string[] = [this.initialState];

    while (!R.isEmpty(unexpandedStates)) {
      // Pick any element from unexpanded set
      let currentState = R.head(unexpandedStates)!;

      reachableStates = R.union(reachableStates, [currentState]);

      for (const symbol of this.alphabet) {
        const nextStates = this.transitionFunction.get(new TransitionFunctionKey(currentState, symbol).toString())?.nextStates ?? [];
        unexpandedStates = R.union(unexpandedStates, nextStates);
      }

      unexpandedStates = R.difference(unexpandedStates, reachableStates);
    }

    // Only keep transitions involving only reachable states - i.e. its current state and next states are ALL reachable
    // states
    // Need to convert to/from an array to be able to filter the map's entries
    let updatedTransitionFunction = new Map(R.filter(([, v]) => (
      R.includes(v.currentState, reachableStates) && isSubset(v.nextStates, reachableStates)
    ), Array.from(this.transitionFunction.entries())));

    let updatedFinalStates = R.intersection(this.finalStates, reachableStates);

    return new Automaton(
      this.name,
      this.alphabet,
      reachableStates,
      updatedTransitionFunction,
      this.initialState, // Initial state is reachable by definition,
      updatedFinalStates,
    );
  }

  private mergeIndistinguishableStates(): Automaton {
    // TODO: Check if deterministic somehow
    // Step 1: Partition the original DFA's states into groups of equivalent states, using Hopcroft's algorithm
    // Implement partition as a set of sets of states - each inner set is a group of equivalent states
    let partition: string[][] = [];

    // Initially partition states into final and non-final states
    let finalStates: string[] = R.clone(this.finalStates);
    let nonFinalStates: string[] = R.difference(this.states, this.finalStates);
    if (!R.isEmpty(finalStates)) {
      partition = R.append(finalStates, partition);
    }
    if (!R.isEmpty(nonFinalStates)) {
      partition = R.append(nonFinalStates, partition);
    }

    let changed: boolean;
    do {
      let newPartition: string[][] = R.clone(partition);
      for (const group of partition) {
        if (R.length(group) <= 1) {
          continue;
        }

        // For each symbol, check if all transitions from that symbol and each state in the group go to a state also in
        // the group; if not create another group
        // Set of states where all transitions from states in the current group lead to states also in current group
        let statesToThisGroup: string[] = [];
        // Set of states where the above is not the case
        let statesToOtherGroup: string[] = [];
        for (const state of group) {
          let toSameGroup: boolean = R.all((symbol) => {
            let nextStates: string[] = this.transitionFunction.get(new TransitionFunctionKey(state, symbol).toString())?.nextStates ?? [];

            // TODO: Might be able to remove as would have already checked that this automaton is a DFA
            if (R.length(nextStates) !== 1) {
              // TODO: Error
            }

            let nextState = R.head(nextStates)!;
            return R.includes(nextState, group);
          }, this.alphabet);

          if (toSameGroup) {
            statesToThisGroup = R.union(statesToThisGroup, [state]);
          } else {
            statesToOtherGroup = R.union(statesToOtherGroup, [state]);
          }
        }

        // Replace current group with the two new groups
        newPartition = R.difference(newPartition, [group]);
        if (!R.isEmpty(statesToThisGroup)) {
          newPartition = R.union(newPartition, [statesToThisGroup]);
        }
        if (!R.isEmpty(statesToOtherGroup)) {
          newPartition = R.union(newPartition, [statesToOtherGroup]);
        }
      }

      // If the partition has changed, overwrite `partition` with `newPartition` ready for the next iteration
      changed = !R.equals(partition, newPartition);
      if (changed) {
        partition = newPartition;
      }
    } while (changed);

    // Step 2: "Flatten" the groups of equivalent states into states and store in a map for use by Steps 2 and 4
    // let groupsToFlattenedStatesMap = new Map(R.map((group) => [
    //   group,
    //   Automaton.flatten(group),
    // ], partition));

    // Step 2: Obtain the minimised DFA's states
    let minimizedStates = R.map(Automaton.flatten, partition);

    // Step 3: Create a map with each of the original DFA's states mapped to its group in the partition, for use by Step 4
    let statesToGroupsMap = new Map(R.chain((group) => R.map((state) => [state, group], group), partition));

    // Step 4: Create transitions of minimised DFA
    // For each transition t_o in the original DFA, create a transition t_m in the minimised DFA, where t_m's current
    // state and next state are the flattened versions of the groups containing t_o's current state and next state
    // respectively
    // TODO: Maybe put converting transition function to/from an array into its own function
    let minimizedTransitionFunction = new Map(R.map(([k, v]) => [
      k,
      ({
        currentState: Automaton.flatten(statesToGroupsMap.get(v.currentState) ?? []),
        symbol: v.symbol,
        nextStates: [Automaton.flatten(statesToGroupsMap.get(R.head(v.nextStates)!) ?? [])],
      }),
    ], Array.from(this.transitionFunction.entries())));

    // The minimised DFA has the same alphabet as the original DFA, but has the merged states and transitions computed above
    return new Automaton(
      this.name,
      this.alphabet,
      minimizedStates,
      minimizedTransitionFunction,
      Automaton.flatten(statesToGroupsMap.get(this.initialState) ?? []),
      R.map((s) => Automaton.flatten(statesToGroupsMap.get(s) ?? []), this.finalStates),
    );
  }

  minimize(): Automaton {
    return this.removeUnreachableStates().mergeIndistinguishableStates();
  }
}
