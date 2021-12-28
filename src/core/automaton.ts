import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import { InputState } from "../component/Input";
import TransitionFunction, {
  transitionFunctionToTransitions,
  transitionsToTransitionFunction,
} from "./transitionFunction";
import TransitionFunctionKey from "./transitionFunctionKey";
import { Run, RunTree, RunTreeNode } from "./run";
import { isSubset } from "./utilities";
import { stateIdToStateName, stateNameToStateId } from "./state";

export default interface Automaton {
  name: string;
  alphabet: string[];
  states: string[];
  transitionFunction: TransitionFunction;
  initialState: string;
  finalStates: string[];
}

export function generatePlaceholderName(index: number): string {
  return `Automaton ${index + 1}`;
}

export function inputStateToAutomaton(inputState: Omit<InputState, "alphabetPresetIndex">, index: number): Automaton {
  const automatonStates = R.map((state) => state.name, inputState.states);

  return {
    name: inputState.name || generatePlaceholderName(index),
    alphabet: inputState.alphabet,
    states: automatonStates,
    transitionFunction: transitionsToTransitionFunction(inputState.transitions, inputState.states),
    initialState: stateIdToStateName(inputState.initialStateId, inputState.states),
    finalStates: R.map((finalStateId) => stateIdToStateName(finalStateId, inputState.states), inputState.finalStateIds),
  };
}

export function automatonToInputState(automaton: Automaton): Omit<InputState, "alphabetPresetIndex"> {
  // Generate a UUID for each of the states
  // Store this as a list of objects
  const states = R.map((s: string) => ({
    name: s,
    id: uuidv4(),
  }), automaton.states);

  return {
    name: automaton.name,
    alphabet: automaton.alphabet,
    states,
    transitions: transitionFunctionToTransitions(automaton.transitionFunction, states),
    initialStateId: stateNameToStateId(automaton.initialState, states),
    finalStateIds: R.map((finalStateName) => stateNameToStateId(finalStateName, states), automaton.finalStates),
  };
}

// TODO: See if typing can be improved
export function automatonToDb(automaton: Automaton): any {
  return {
    name: automaton.name,
    alphabet: automaton.alphabet,
    states: automaton.states,
    transitionFunction: Object.fromEntries(automaton.transitionFunction),
    initialState: automaton.initialState,
    finalStates: automaton.finalStates,
  };
}

export function dbToAutomaton(value: any): Automaton {
  const transitionFunction = value.transitionFunction
    ? new Map(Object.entries(value.transitionFunction))
    : new Map();

  for (const entry of transitionFunction) {
    if (entry[1].symbol === undefined) {
      entry[1].symbol = null;
    }
  }

  return {
    name: value.name,
    alphabet: value.alphabet ?? [],
    states: value.states ?? [],
    transitionFunction,
    initialState: value.initialState,
    finalStates: value.finalStates ?? [],
  };
}

function computeEpsilonClosure(automaton: Automaton, states: string[]): string[] {
  let closure = [...states];
  let changed: boolean;
  let newlyVisited = [...states];

  do {
    newlyVisited = R.chain((state1) => (
      automaton.transitionFunction.get(new TransitionFunctionKey(state1, null).toString())?.nextStates ?? []
    ), newlyVisited);
    const updatedClosure = R.union(closure, newlyVisited);
    changed = !R.equals(closure, updatedClosure);
    closure = updatedClosure;
  } while (changed);

  return closure;
}

export function computeRun(automaton: Automaton, input: string): Run {
  let currentStates = computeEpsilonClosure(automaton, [automaton.initialState]);
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
      automaton.transitionFunction.get(new TransitionFunctionKey(state, symbol).toString())?.nextStates ?? []
    ), currentStates);
    nextStatesUnion = computeEpsilonClosure(automaton, nextStatesUnion);

    currentStates = nextStatesUnion;
    visitedStates = R.append({
      states: currentStates,
      symbol,
    }, visitedStates);
  }

  return visitedStates;
}

export function computeRunTree(automaton: Automaton, input: string): RunTree {
  const createTree = (state: string, symbol: string | null): RunTreeNode => ({
    id: uuidv4(),
    state,
    symbol,
    children: [],
  });

  const roots = R.map(R.partialRight(createTree, [null]), computeEpsilonClosure(automaton, [automaton.initialState]));
  let currentLevel = [...roots];

  for (const symbol of input) {
    let nextLevel: RunTreeNode[] = [];
    for (const node of currentLevel) {
      let nextStates = automaton.transitionFunction.get(new TransitionFunctionKey(node.state, symbol).toString())?.nextStates ?? [];
      nextStates = computeEpsilonClosure(automaton, nextStates);

      const newNodes = R.map(R.partialRight(createTree, [symbol]), nextStates);

      node.children = newNodes;

      nextLevel = [...nextLevel, ...newNodes];
    }
    currentLevel = nextLevel;
  }

  return roots;
}

export function accepts(automaton: Automaton, run: Run): boolean {
  return !R.isEmpty(R.intersection(R.last(run)?.states ?? [], automaton.finalStates));
}

function flatten(states: string[]): string {
  return `{${states.join(", ")}}`;
}

export function determinize(automaton: Automaton): Automaton {
  const dfaInitialState = computeEpsilonClosure(automaton, [automaton.initialState]);

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
    const dfaCurrentStateFlattened = flatten(dfaCurrentState);
    dfaStatesFlattened = R.union(dfaStatesFlattened, [dfaCurrentStateFlattened]);

    // Add the (flattened) DFA state to the (flattened) final states set if it is final
    // The DFA state is final if any of the contained NFA states is final
    // TODO: Maybe replace with a map() at the end of the method
    const isFinalState = R.any(R.includes(R.__, automaton.finalStates), dfaCurrentState);
    if (isFinalState) {
      dfaFinalStatesFlattened = R.union(dfaFinalStatesFlattened, [dfaCurrentStateFlattened]);
    }

    for (const symbol of automaton.alphabet) {
      let dfaNextState = R.chain((nfaState) => automaton.transitionFunction.get(new TransitionFunctionKey(nfaState, symbol).toString())?.nextStates ?? [], dfaCurrentState);
      dfaNextState = computeEpsilonClosure(automaton, dfaNextState);

      // Add DFA state (flattened version)
      const dfaNextStateFlattened = flatten(dfaNextState);
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

  return {
    name: `${automaton.name} [Determinised]`,
    alphabet: automaton.alphabet,
    states: dfaStatesFlattened,
    transitionFunction: dfaTransitionFunction,
    initialState: flatten(dfaInitialState),
    finalStates: dfaFinalStatesFlattened,
  };
}

// This doesn't take into account epsilon transitions as I only intend this to be run as part of DFA minimization
function removeUnreachableStates(automaton: Automaton): Automaton {
  // TODO: Check if automaton is DFA / doesn't have epsilon transitions
  let reachableStates: string[] = [automaton.initialState];
  let unexpandedStates: string[] = [automaton.initialState];

  while (!R.isEmpty(unexpandedStates)) {
    // Pick any element from unexpanded set
    const currentState = R.head(unexpandedStates)!;

    reachableStates = R.union(reachableStates, [currentState]);

    for (const symbol of automaton.alphabet) {
      const nextStates = automaton.transitionFunction.get(new TransitionFunctionKey(currentState, symbol).toString())?.nextStates ?? [];
      unexpandedStates = R.union(unexpandedStates, nextStates);
    }

    unexpandedStates = R.difference(unexpandedStates, reachableStates);
  }

  // Only keep transitions involving only reachable states - i.e. its current state and next states are ALL reachable
  // states
  // Need to convert to/from an array to be able to filter the map's entries
  const updatedTransitionFunction = new Map(R.filter(([, v]) => (
    R.includes(v.currentState, reachableStates) && isSubset(v.nextStates, reachableStates)
  ), Array.from(automaton.transitionFunction.entries())));

  const updatedFinalStates = R.intersection(automaton.finalStates, reachableStates);

  return {
    name: automaton.name,
    alphabet: automaton.alphabet,
    states: reachableStates,
    transitionFunction: updatedTransitionFunction,
    initialState: automaton.initialState, // Initial state is reachable by definition,
    finalStates: updatedFinalStates,
  };
}

function mergeIndistinguishableStates(automaton: Automaton): Automaton {
  // TODO: Check if deterministic somehow
  // Step 1: Partition the original DFA's states into groups of equivalent states, using Hopcroft's algorithm
  // Implement partition as a set of sets of states - each inner set is a group of equivalent states
  let partition: string[][] = [];

  // Initially partition states into final and non-final states
  const finalStates: string[] = R.clone(automaton.finalStates);
  const nonFinalStates: string[] = R.difference(automaton.states, automaton.finalStates);
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
        const toSameGroup: boolean = R.all((symbol) => {
          const nextStates: string[] = automaton.transitionFunction.get(new TransitionFunctionKey(state, symbol).toString())?.nextStates ?? [];

          // TODO: Might be able to remove as would have already checked that this automaton is a DFA
          if (R.length(nextStates) !== 1) {
            // TODO: Error
          }

          const nextState = R.head(nextStates)!;
          return R.includes(nextState, group);
        }, automaton.alphabet);

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
  const minimizedStates = R.map(flatten, partition);

  // Step 3: Create a map with each of the original DFA's states mapped to its group in the partition, for use by Step 4
  const statesToGroupsMap = new Map(R.chain((group) => R.map((state) => [state, group], group), partition));

  // Step 4: Create transitions of minimised DFA
  // For each transition t_o in the original DFA, create a transition t_m in the minimised DFA, where t_m's current
  // state and next state are the flattened versions of the groups containing t_o's current state and next state
  // respectively
  // TODO: Maybe put converting transition function to/from an array into its own function
  const minimizedTransitionFunction = new Map(R.map(([k, v]) => [
    k,
    ({
      currentState: flatten(statesToGroupsMap.get(v.currentState) ?? []),
      symbol: v.symbol,
      nextStates: [flatten(statesToGroupsMap.get(R.head(v.nextStates)!) ?? [])],
    }),
  ], Array.from(automaton.transitionFunction.entries())));

  // The minimised DFA has the same alphabet as the original DFA, but has the merged states and transitions computed above
  return {
    name: automaton.name,
    alphabet: automaton.alphabet,
    states: minimizedStates,
    transitionFunction: minimizedTransitionFunction,
    initialState: flatten(statesToGroupsMap.get(automaton.initialState) ?? []),
    finalStates: R.map((s) => flatten(statesToGroupsMap.get(s) ?? []), automaton.finalStates),
  };
}

export function minimize(automaton: Automaton): Automaton {
  return mergeIndistinguishableStates(removeUnreachableStates(automaton));
}
