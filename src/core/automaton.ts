import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import { InputState } from "../component/Input";
import TransitionFunction, {
  createTransitionFunctionKey,
  transitionFunctionToTransitions,
  transitionsToTransitionFunction,
} from "./transitionFunction";
import { Run, RunTree, RunTreeNode } from "./run";
import { isSubset } from "./utilities";
import { stateIdToStateName, stateNameToStateId } from "./state";

type CreatedReason = "determinized" | "minimized";

export default interface Automaton {
  name: string;
  createdReason?: CreatedReason;
  alphabet: string[];
  states: string[];
  transitionFunction: TransitionFunction;
  initialState: string;
  finalStates: string[];
}

type GnfaTransition= {
  currentState: string;
  nextState: string;
  regex: string;
};

type GnfaTransitionFunction = Map<string, GnfaTransition>;

interface Gnfa {
  alphabet: string[];
  states: string[];
  transitionFunction: GnfaTransitionFunction;
  initialState: string;
  finalState: string;
}

function createGnfaTransitionFunctionKey(currentState: string, nextState: string) {
  return `currentState=${currentState}, nextState=${nextState}`;
}

export function generatePlaceholderName(index: number): string {
  return `Automaton ${index + 1}`;
}

export function inputStateToAutomaton(inputState: InputState, index: number): Automaton {
  const automatonStates = R.map((state) => state.name, inputState.states);

  return {
    name: inputState.name || generatePlaceholderName(index),
    alphabet: inputState.alphabet,
    states: automatonStates,
    transitionFunction: transitionsToTransitionFunction(inputState.transitions, inputState.states),
    initialState: stateIdToStateName(inputState.initialStateId, inputState.states),
    finalStates: R.map(
      (finalStateId) => stateIdToStateName(finalStateId, inputState.states),
      inputState.finalStateIds,
    ),
  };
}

export function automatonToInputState(automaton: Automaton): InputState {
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
    finalStateIds: R.map(
      (finalStateName) => stateNameToStateId(finalStateName, states),
      automaton.finalStates,
    ),
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
      automaton.transitionFunction
        .get(createTransitionFunctionKey(state1, null))
        ?.nextStates ?? []
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
      automaton.transitionFunction
        .get(createTransitionFunctionKey(state, symbol))
        ?.nextStates ?? []
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

  const roots = R.map(
    R.partialRight(createTree, [null]),
    computeEpsilonClosure(automaton, [automaton.initialState]),
  );
  let currentLevel = [...roots];

  for (const symbol of input) {
    let nextLevel: RunTreeNode[] = [];
    for (const node of currentLevel) {
      let nextStates = automaton.transitionFunction
        .get(createTransitionFunctionKey(node.state, symbol))
        ?.nextStates ?? [];
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

    // Note that flattening is done on-the-fly, therefore there is no full un-flattened version of
    // the DFA
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
      let dfaNextState = R.chain(
        (nfaState) => automaton.transitionFunction
          .get(createTransitionFunctionKey(nfaState, symbol))
          ?.nextStates ?? [],
        dfaCurrentState,
      );
      dfaNextState = computeEpsilonClosure(automaton, dfaNextState);

      // Add DFA state (flattened version)
      const dfaNextStateFlattened = flatten(dfaNextState);
      dfaStatesFlattened = R.union(dfaStatesFlattened, [dfaNextStateFlattened]);

      // Add DFA transition - note its current and next states are the flattened versions
      dfaTransitionFunction.set(
        createTransitionFunctionKey(dfaCurrentStateFlattened, symbol),
        {
          currentState: dfaCurrentStateFlattened,
          symbol,
          nextStates: [dfaNextStateFlattened],
        },
      );

      // Add next states ready to expanded in future iteration
      unexpandedDfaStates = R.union(unexpandedDfaStates, [dfaNextState]);
    }

    // Remove any expanded states from the unexpanded set
    // Needed as the computed DFA next state may be the same as one expanded previously
    unexpandedDfaStates = R.difference(unexpandedDfaStates, expandedDfaStates);
  }

  return {
    name: automaton.name,
    createdReason: "determinized",
    alphabet: automaton.alphabet,
    states: dfaStatesFlattened,
    transitionFunction: dfaTransitionFunction,
    initialState: flatten(dfaInitialState),
    finalStates: dfaFinalStatesFlattened,
  };
}

// This doesn't take into account epsilon transitions as I only intend this to be run as part of DFA
// minimization
function removeUnreachableStates(automaton: Automaton): Automaton {
  // TODO: Check if automaton is DFA / doesn't have epsilon transitions
  let reachableStates: string[] = [automaton.initialState];
  let unexpandedStates: string[] = [automaton.initialState];

  while (!R.isEmpty(unexpandedStates)) {
    // Pick any element from unexpanded set
    const currentState = R.head(unexpandedStates)!;

    reachableStates = R.union(reachableStates, [currentState]);

    for (const symbol of automaton.alphabet) {
      const nextStates = automaton.transitionFunction
        .get(createTransitionFunctionKey(currentState, symbol))
        ?.nextStates ?? [];
      unexpandedStates = R.union(unexpandedStates, nextStates);
    }

    unexpandedStates = R.difference(unexpandedStates, reachableStates);
  }

  // Only keep transitions involving only reachable states - i.e. its current state and next states
  // are ALL reachable states
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
  // Step 1: Partition the original DFA's states into groups of equivalent states, using Hopcroft's
  // algorithm
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

      // For each symbol, check if all transitions from that symbol and each state in the group go
      // to a state also in the group; if not create another group
      // Set of states where all transitions from states in the current group lead to states also in
      // current group
      let statesToThisGroup: string[] = [];
      // Set of states where the above is not the case
      let statesToOtherGroup: string[] = [];
      for (const state of group) {
        const toSameGroup: boolean = R.all((symbol) => {
          const nextStates: string[] = automaton.transitionFunction
            .get(createTransitionFunctionKey(state, symbol))
            ?.nextStates ?? [];

          // TODO: Might be able to remove as would have already checked that this automaton is a
          //  DFA
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

    // If the partition has changed, overwrite `partition` with `newPartition` ready for the next
    // iteration
    changed = !R.equals(partition, newPartition);
    if (changed) {
      partition = newPartition;
    }
  } while (changed);

  // Step 2: "Flatten" the groups of equivalent states into states and store in a map for use by
  // Steps 2 and 4
  // let groupsToFlattenedStatesMap = new Map(R.map((group) => [
  //   group,
  //   Automaton.flatten(group),
  // ], partition));

  // Step 2: Obtain the minimised DFA's states
  const minimizedStates = R.map(flatten, partition);

  // Step 3: Create a map with each of the original DFA's states mapped to its group in the
  // partition, for use by Step 4
  const statesToGroupsMap = new Map(
    R.chain((group) => R.map((state) => [state, group], group), partition),
  );

  // Step 4: Create transitions of minimised DFA
  // For each transition t_o in the original DFA, create a transition t_m in the minimised DFA,
  // where t_m's current state and next state are the flattened versions of the groups containing
  // t_o's current state and next state respectively
  // TODO: Maybe put converting transition function to/from an array into its own function
  const minimizedTransitionFunction = new Map(R.map(([k, v]) => [
    k,
    ({
      currentState: flatten(statesToGroupsMap.get(v.currentState) ?? []),
      symbol: v.symbol,
      nextStates: [flatten(statesToGroupsMap.get(R.head(v.nextStates)!) ?? [])],
    }),
  ], Array.from(automaton.transitionFunction.entries())));

  // The minimised DFA has the same alphabet as the original DFA, but has the merged states and
  // transitions computed above
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
  return R.mergeLeft(mergeIndistinguishableStates(removeUnreachableStates(automaton)), {
    createdReason: "minimized" as CreatedReason,
  });
}

function createGnfaInitialState(automaton: Automaton): Automaton {
  // If initial state is a final state or has incoming transitions, add a new non-final initial
  // state and add an epsilon-transition between the new initial state and former initial state
  const initialStateIsFinal = R.includes(automaton.initialState, automaton.finalStates);
  const initialStateHasIncomingTransitions = R.includes(
    automaton.initialState,
    R.chain((entry) => entry.nextStates, Array.from(automaton.transitionFunction.values())),
  );
  if (initialStateIsFinal || initialStateHasIncomingTransitions) {
    const newState = uuidv4();

    const states = R.append(newState, automaton.states);
    const initialState = newState;
    const transitionFunction = new Map(automaton.transitionFunction);
    transitionFunction.set(createTransitionFunctionKey(newState, null), {
      currentState: newState,
      symbol: null,
      nextStates: [automaton.initialState],
    });

    return R.mergeRight(automaton, { states, transitionFunction, initialState });
  }

  return automaton;
}

function createGnfaFinalState(automaton: Automaton): Automaton {
  // If there is more than one final state or the single final state has outgoing transitions, add a
  // new final state, make all other states non-final and add an epsilon-transition from each former
  // final state to the new final state
  const multipleFinalStates = R.length(automaton.finalStates) > 1;
  const finalStatesHaveOutgoingTransitions = !R.isEmpty(R.intersection(
    automaton.finalStates,
    R.map((entry) => entry.currentState, Array.from(automaton.transitionFunction.values())),
  ));
  if (multipleFinalStates || finalStatesHaveOutgoingTransitions) {
    const newFinalState = uuidv4();
    const states = R.append(newFinalState, automaton.states);
    const transitionFunction = new Map(automaton.transitionFunction);
    R.forEach((finalState) => (
      transitionFunction.set(createTransitionFunctionKey(finalState, null), {
        currentState: finalState,
        symbol: null,
        nextStates: [newFinalState],
      })
    ), automaton.finalStates);
    const finalStates = [newFinalState];

    return R.mergeRight(automaton, { states, transitionFunction, finalStates });
  }

  return automaton;
}

interface Edge {
  currentState: string;
  symbols: (string | null)[];
  nextState: string;
}

export function groupTransitionsByCurrentStateAndNextState(
  transitionFunction: TransitionFunction,
  alphabet: string[],
): Edge[] {
  // Idea is to convert from a transition function (transitions grouped by current state and symbol)
  // to edges (transitions grouped by current state and next state)
  return R.pipe(
    // Convert transition function to a list of transitions
    (transitionFunction: TransitionFunction) => Array.from(transitionFunction.values()),

    // Originally each transition contains a current state, symbol and a *list* of next states
    // Convert transitions so that each transition contains a current state, symbol and a *single*
    // next state
    R.chain((transition) => R.map((nextState) => ({
      currentState: transition.currentState,
      symbol: transition.symbol,
      nextState,
    }), transition.nextStates)),

    // Sort transitions by current states and next state so that the grouping works correctly
    // (This is because R.groupWith only groups adjacent items)
    R.sortWith([R.ascend((t) => t.currentState), R.ascend((t) => t.nextState)]),

    // Group transitions by current state and next state
    R.groupWith((t1, t2) => t1.currentState === t2.currentState && t1.nextState === t2.nextState),

    // Convert transitions so that each transition contains a current state, next state and a *list*
    // of symbols
    R.map((group) => ({
      currentState: group[0].currentState,
      symbols: R.sortBy(
        (symbol: string | null) => (symbol === null ? -1 : R.indexOf(symbol, alphabet)),
        R.map((t) => t.symbol, group),
      ),
      nextState: group[0].nextState,
    })),
  )(transitionFunction);
}

function convertNfaTransitionFunctionToGnfaTransitionFunction(
  nfaTransitionFunction: TransitionFunction,
  alphabet: string[],
): GnfaTransitionFunction {
  const groupedTransitions = groupTransitionsByCurrentStateAndNextState(
    nfaTransitionFunction,
    alphabet,
  );
  const gnfaTransitions = R.map((t) => ({
    currentState: t.currentState,
    regex: R.join("|", R.map((symbol) => symbol ?? "ε", t.symbols)),
    nextState: t.nextState,
  }), groupedTransitions);
  return new Map(R.map(
    (t) => [createGnfaTransitionFunctionKey(t.currentState, t.nextState), t],
    gnfaTransitions,
  ));
}

function convertNfaToGnfa(automaton: Automaton): Gnfa {
  // Uses state elimination method
  // As described in: https://courses.cs.washington.edu/courses/cse311/14sp/kleene.pdf
  let newAutomaton = createGnfaInitialState(automaton);
  newAutomaton = createGnfaFinalState(newAutomaton);

  return {
    alphabet: newAutomaton.alphabet,
    states: newAutomaton.states,
    transitionFunction: convertNfaTransitionFunctionToGnfaTransitionFunction(
      newAutomaton.transitionFunction,
      newAutomaton.alphabet,
    ),
    initialState: newAutomaton.initialState,
    finalState: R.head(newAutomaton.finalStates)!,
  };
}

function convertGnfaToRegex(gnfa: Gnfa): string {
  let states = gnfa.states;
  let transitionFunction = new Map(gnfa.transitionFunction);
  while (R.length(states) > 2) {
    const stateToRemove = R.head(R.reject(
      (state) => state === gnfa.initialState || state === gnfa.finalState,
      states,
    ))!;
    const incomingTransitions = R.filter(
      (t) => t.nextState === stateToRemove && t.currentState !== stateToRemove,
      Array.from(transitionFunction.values()),
    );
    const outgoingTransitions = R.filter(
      (t) => t.currentState === stateToRemove && t.nextState !== stateToRemove,
      Array.from(transitionFunction.values()),
    );
    // Because there may only be a single transition between a pair of states (obviously this
    // includes self-loops) in a GNFA, a state will have at most one self-loop
    const selfLoop = transitionFunction.get(createGnfaTransitionFunctionKey(stateToRemove, stateToRemove));

    // All paths involving an incoming transition, self loop (if it exists) and outgoing transition
    const newTransitions = R.map(([incomingTransition, outgoingTransition]: [GnfaTransition, GnfaTransition]) => {
      let regex = "";
      if (!R.isEmpty(incomingTransition.regex)) {
        regex += `(${incomingTransition.regex})`;
      }
      if (selfLoop !== undefined) {
        regex += `((${selfLoop.regex})*)`;
      }
      if (!R.isEmpty(outgoingTransition.regex)) {
        regex += `(${outgoingTransition.regex})`;
      }

      return {
        currentState: incomingTransition.currentState,
        nextState: outgoingTransition.nextState,
        regex,
      };
    }, R.xprod(incomingTransitions, outgoingTransitions));

    // Remove old transitions
    R.forEach((t) => transitionFunction.delete(createGnfaTransitionFunctionKey(t.currentState, t.nextState)), [
      ...incomingTransitions,
      ...outgoingTransitions,
    ]);
    if (selfLoop) {
      transitionFunction.delete(createGnfaTransitionFunctionKey(selfLoop.currentState, selfLoop.nextState));
    }

    // Remove state
    states = R.without([stateToRemove], states);

    // Add new transitions
    R.forEach(
      (newTransition) => {
        const transitionFunctionKey = createGnfaTransitionFunctionKey(newTransition.currentState, newTransition.nextState);
        if (transitionFunction.has(transitionFunctionKey)) {
          const existingTransition = transitionFunction.get(transitionFunctionKey)!;
          transitionFunction.set(transitionFunctionKey, {
            ...newTransition,
            regex: `${existingTransition.regex}|${newTransition.regex}`,
          });
        } else {
          transitionFunction.set(transitionFunctionKey, newTransition);
        }
      },
      newTransitions,
    );
  }

  return transitionFunction.get(createGnfaTransitionFunctionKey(gnfa.initialState, gnfa.finalState))?.regex ?? "";
}
// todo: create gnfa tf class that merges regex instead of overwriting
export function convertNfaToRegex(automaton: Automaton): string {
  return convertGnfaToRegex(convertNfaToGnfa(automaton));
}
