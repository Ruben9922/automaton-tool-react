import * as R from "ramda";
import {NIL} from "uuid";
import Transition from "./transition";
import {isSubset, isUnique, isUniqueList} from "./utilities";
import State, {stateIdToStateName} from "./state";

interface Check<T> {
  isValid: T;
  message: string;
}

interface Errors {
  alphabet: {
    isNonEmpty: Check<boolean>;
    areSymbolsUnique: Check<boolean>;
  };
  states: {
    // TODO: Change from Check<boolean[]> to Check<Map<string, boolean>>
    areStateNamesNonEmpty: Check<boolean[]>;
    areStateNamesUnique: Check<boolean[]>;
    exactlyOneInitialState: Check<boolean>;
    isNonEmpty: Check<boolean>;
  };
  transitions: {
    areCurrentStatesNonEmpty: Check<boolean[]>;
    areCurrentStatesValid: Check<boolean[]>;
    areSymbolsNonEmpty: Check<boolean[]>;
    areTransitionsUnique: Check<boolean[]>;
    areSymbolsValid: Check<boolean[]>;
    areNextStatesNonEmpty: Check<boolean[]>;
    areNextStatesValid: Check<boolean[]>;
  };
}

// TODO: Not sure whether to merge this with Errors / restructure these checks
interface Warnings {
  states: {
    atLeastOneFinalState: Check<boolean>; // Warning
    atLeastOneNonFinalState: Check<boolean>; // Warning
  };
  transitions: {
    isNonEmpty: Check<boolean>; // Warning
  };
}

interface Disabled {
  transitions: {
    symbol: Check<boolean[]>;
    nextStates: Check<boolean[]>;
    currentState: Check<boolean[]>;
  };
}

export interface AlphabetErrorState {
  alphabet: boolean;
}

export interface StatesErrorState {
  stateName: boolean[];
}

export interface TransitionsErrorState {
  symbol: boolean[];
  nextStates: boolean[];
  currentState: boolean[];
}

interface ErrorState {
  alphabet: AlphabetErrorState;
  states: StatesErrorState;
  transitions: TransitionsErrorState;
}

export interface AlphabetHelperText {
  alphabet: string | null;
}

export interface StatesHelperText {
  stateName: (string | null)[];
}

export interface TransitionsHelperText {
  symbol: (string | null)[];
  nextStates: (string | null)[];
  currentState: (string | null)[];
}

interface HelperText {
  alphabet: AlphabetHelperText;
  states: StatesHelperText;
  transitions: TransitionsHelperText;
}

// For single boolean values, can compute error state by doing !(x1 && ... && xn)
// (each xi is a check)
// For lists, need to repeat this for each item in the lists
function createErrorStateList(checks: Check<boolean[]>[], disabled?: Check<boolean[]>): boolean[] {
  if (R.isEmpty(checks)) {
    return [];
  }

  const checksIsValid = R.map((c: Check<boolean[]>) => c.isValid, checks);
  const identity = R.map(R.T, checksIsValid);

  let l = R.reduce((es: boolean[], c: boolean[]) => (
    R.zipWith((x: boolean, y: boolean) => x && y, es, c)
  ), identity, checksIsValid);

  l = R.map(R.not, l);

  if (disabled !== undefined) {
    l = R.zipWith((x, y) => x && y, disabled.isValid, l);
  }

  return l;
}

function createSummaryCheck(check: Check<boolean>, dependencies: boolean[] = []): Check<boolean> {
  return {
    isValid: R.reduceRight((dependency: boolean, acc: boolean) => !dependency || acc, check.isValid, dependencies),
    message: check.message,
  };
}

function createSummaryCheckList(check: Check<boolean[]>, listPrefix: string, dependencies: boolean[][] = []): Check<boolean> {
  const isValid = R.reduceRight((dependency: boolean[], acc: boolean[]) => (
    R.zipWith((dependencyItem: boolean, accItem: boolean) => !dependencyItem || accItem, dependency, acc)
  ), check.isValid, dependencies);

  return {
    isValid: R.all(R.identity, isValid),
    message: `${check.message} (${listPrefix}: ${R.join(", ", R.filter((y) => y !== null, R.zipWith((index, isValid) => (isValid ? null : index), R.range(1, isValid.length + 1), isValid)))})`,
  };
}

function createHelperText(c: Check<boolean>): string | null {
  return c.isValid ? null : c.message;
}

function createHelperTextList(c: Check<boolean[]>): (string | null)[] {
  return R.map((x) => (x ? null : c.message), c.isValid);
}

function createHelperTextMultiple(checks: Check<boolean>[]): string | null {
  return R.reduce((h: string | null, c: Check<boolean>) => (
    h !== null ? R.reduced(h) : createHelperText(c)
  ), null, checks);
}

// Same idea as `createErrorStateList`
function createHelperTextListMultiple(checks: Check<boolean[]>[]): (string | null)[] {
  if (R.isEmpty(checks)) {
    return [];
  }

  const helperTextLists = R.map(createHelperTextList, checks);
  const identity = R.map(() => null, helperTextLists);

  return R.reduce((hs: (string | null)[], c: (string | null)[]) => (
    R.zipWith((x: string | null, y: string | null) => (
      x === null ? y : x
    ), hs, c)
  ), identity, helperTextLists);
}

function createAlertTextList(checks: Check<boolean>[]): string[] {
  return R.filter((x: string | null) => x !== null,
    R.map((c) => (c.isValid ? null : c.message), checks)) as string[];
}

// export function allValid(checks: Record<string, Check<boolean>>): boolean {
//   return R.all((e: Check<boolean>) => e.isValid, R.values(checks));
// }

export function validate(alphabet: string[], states: State[], transitions: Transition[], initialStateId: string, finalStateIds: string[]) {
  const stateIds = R.map((state) => state.id, states);
  const stateNames = R.map((state) => state.name, states);

  const errors: Errors = {
    alphabet: {
      isNonEmpty: {
        isValid: !R.isEmpty(alphabet),
        message: "Alphabet cannot be empty",
      },
      areSymbolsUnique: {
        isValid: isUnique(alphabet),
        message: "Alphabet must contain unique symbols",
      },
    },
    states: {
      isNonEmpty: {
        isValid: !R.isEmpty(states),
        message: "At least one state is required",
      },
      areStateNamesNonEmpty: {
        isValid: R.map((s) => !R.isEmpty(s), stateNames),
        message: "State name cannot be left blank",
      },
      areStateNamesUnique: {
        isValid: isUniqueList(R.equals, stateNames),
        message: "State name must be unique",
      },
      exactlyOneInitialState: {
        isValid: initialStateId !== NIL,
        message: "A state must be selected as the initial state",
      },
    },
    transitions: {
      areCurrentStatesNonEmpty: {
        isValid: R.map((transition) => transition.currentState !== "", transitions),
        message: "Current state cannot be left blank",
      },
      areCurrentStatesValid: {
        isValid: R.map((transition) => stateIds.includes(transition.currentState), transitions),
        message: "State does not exist",
      },
      areSymbolsNonEmpty: {
        isValid: R.map((transition) => transition.symbol !== "", transitions),
        message: "Symbol cannot be left blank",
      },
      areSymbolsValid: {
        isValid: R.map((transition) => transition.symbol === null || alphabet.includes(transition.symbol), transitions),
        message: "Symbol does not exist in alphabet",
      },
      areNextStatesNonEmpty: {
        isValid: R.map((transition) => !R.isEmpty(transition.nextStates), transitions),
        message: "Next states cannot be empty",
      },
      areNextStatesValid: {
        isValid: R.map((transition) => isSubset(transition.nextStates, stateIds), transitions),
        message: "One or more states do not exist",
      },
      areTransitionsUnique: {
        isValid: isUniqueList((t1, t2) => (
          t1.currentState === t2.currentState && t1.symbol === t2.symbol
        ), transitions),
        message: "Transition must be unique",
      },
    },
  };

  // Warning checks to be performed
  // Similar to `errors` but for warnings (issues where the input is still valid)
  const warnings: Warnings = {
    states: {
      atLeastOneFinalState: {
        isValid: !R.isEmpty(finalStateIds),
        message: "No state is selected as the final state, so all strings will be rejected by the automaton",
      },
      atLeastOneNonFinalState: {
        isValid: !R.equals(stateIds, finalStateIds),
        message: "All states are selected as final states, so all strings will be accepted by the automaton",
      },
    },
    transitions: {
      isNonEmpty: {
        isValid: !R.isEmpty(transitions),
        // eslint-disable-next-line no-nested-ternary
        message: !R.includes(initialStateId, stateIds) ? "There are no transitions" : (
          R.includes(initialStateId, finalStateIds)
            ? `There are no transitions and initial state "${stateIdToStateName(initialStateId, states)!}" is a final state, so all strings will be accepted by the automaton`
            : `There are no transitions and initial state "${stateIdToStateName(initialStateId, states)!}" is not a final state, so all strings will be rejected by the automaton`
        ),
      },
    },
  };

  const disabled: Disabled = {
    transitions: {
      currentState: {
        isValid: R.map(() => errors.states.isNonEmpty.isValid, transitions),
        message: "There are no states",
      },
      symbol: {
        isValid: R.map(() => errors.alphabet.isNonEmpty.isValid, transitions),
        message: "Alphabet is empty",
      },
      nextStates: {
        isValid: R.map(() => errors.states.isNonEmpty.isValid, transitions),
        message: "There are no states",
      },
    },
  };

  // Error state for each input
  // Some inputs may be associated with more than one check - e.g. check state name is non-empty AND
  // unique
  // Hence need to combine error checks into a boolean value for each input
  // Could just check whether helper text is non-empty but may want to display helper text not for
  // an error
  const errorState: ErrorState = {
    alphabet: {
      alphabet: !errors.alphabet.isNonEmpty.isValid || !errors.alphabet.areSymbolsUnique.isValid,
    },
    states: {
      stateName: createErrorStateList([
        errors.states.areStateNamesNonEmpty,
        errors.states.areStateNamesUnique,
      ]),
    },
    transitions: {
      currentState: createErrorStateList([
        errors.transitions.areCurrentStatesNonEmpty,
        errors.transitions.areCurrentStatesValid,
        errors.transitions.areTransitionsUnique,
      ], disabled.transitions.currentState),
      symbol: createErrorStateList([
        errors.transitions.areSymbolsNonEmpty,
        errors.transitions.areSymbolsValid,
        errors.transitions.areTransitionsUnique,
      ], disabled.transitions.symbol),
      nextStates: createErrorStateList([
        errors.transitions.areNextStatesNonEmpty,
        errors.transitions.areNextStatesValid,
      ], disabled.transitions.nextStates),
    },
  };

  // Helper text for each input
  // Same idea as `errorState`
  const helperText: HelperText = {
    alphabet: {
      alphabet: createHelperTextMultiple([
        errors.alphabet.isNonEmpty,
        errors.alphabet.areSymbolsUnique,
      ]),
    },
    states: {
      stateName: createHelperTextListMultiple([
        errors.states.areStateNamesNonEmpty,
        errors.states.areStateNamesUnique,
      ]),
    },
    transitions: {
      currentState: createHelperTextListMultiple([
        disabled.transitions.currentState,
        errors.transitions.areCurrentStatesNonEmpty,
        errors.transitions.areCurrentStatesValid,
        errors.transitions.areTransitionsUnique,
      ]),
      symbol: createHelperTextListMultiple([
        disabled.transitions.symbol,
        errors.transitions.areSymbolsNonEmpty,
        errors.transitions.areSymbolsValid,
        errors.transitions.areTransitionsUnique,
      ]),
      nextStates: createHelperTextListMultiple([
        disabled.transitions.nextStates,
        errors.transitions.areNextStatesNonEmpty,
        errors.transitions.areNextStatesValid,
      ]),
    },
  };

  // List of error messages to display in an alert
  // Some errors can't be associated with an input - e.g. states or transitions list being empty
  // Hence these are displayed in an alert
  const errorAlertText: string[] = createAlertTextList([
    errors.alphabet.isNonEmpty,
    errors.alphabet.areSymbolsUnique,
    errors.states.isNonEmpty,
    createSummaryCheck(errors.states.exactlyOneInitialState, [errors.states.isNonEmpty.isValid]),
    createSummaryCheckList(errors.states.areStateNamesNonEmpty, "states"),
    createSummaryCheckList(errors.states.areStateNamesUnique, "states", [errors.states.areStateNamesNonEmpty.isValid]),
    createSummaryCheckList(errors.transitions.areCurrentStatesNonEmpty, "transitions", [disabled.transitions.currentState.isValid]),
    createSummaryCheckList(errors.transitions.areCurrentStatesValid, "transitions", [
      disabled.transitions.currentState.isValid,
      errors.transitions.areCurrentStatesNonEmpty.isValid,
    ]),
    createSummaryCheckList(errors.transitions.areSymbolsNonEmpty, "transitions", [disabled.transitions.symbol.isValid]),
    createSummaryCheckList(errors.transitions.areSymbolsValid, "transitions", [
      disabled.transitions.symbol.isValid,
      errors.transitions.areSymbolsNonEmpty.isValid,
    ]),
    createSummaryCheckList(errors.transitions.areTransitionsUnique, "transitions", [
      disabled.transitions.currentState.isValid,
      disabled.transitions.symbol.isValid,
      errors.transitions.areCurrentStatesNonEmpty.isValid,
      errors.transitions.areCurrentStatesValid.isValid,
      errors.transitions.areSymbolsNonEmpty.isValid,
      errors.transitions.areSymbolsValid.isValid,
    ]),
    createSummaryCheckList(errors.transitions.areNextStatesNonEmpty, "transitions", [disabled.transitions.nextStates.isValid]),
    createSummaryCheckList(errors.transitions.areNextStatesValid, "transitions", [
      disabled.transitions.nextStates.isValid,
      errors.transitions.areNextStatesNonEmpty.isValid,
    ]),
  ]);

  // List of warning messages to display in an alert
  const warningAlertText: string[] = R.concat(createAlertTextList([
    createSummaryCheck(warnings.states.atLeastOneFinalState, [errors.states.isNonEmpty.isValid]),
    createSummaryCheck(warnings.states.atLeastOneNonFinalState, [errors.states.isNonEmpty.isValid]),
  ]), createAlertTextList([
    warnings.transitions.isNonEmpty,
  ]));

  return {
    errorState,
    helperText,
    errorAlertText,
    warningAlertText,
  };
}
