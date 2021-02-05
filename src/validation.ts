import * as R from "ramda";
import { NIL } from "uuid";
import State from "./state";
import Transition from "./transition";
import { findStateById, isSubset, isUnique } from "./utilities";

interface Check<T> {
  isValid: T;
  message: string;
}

interface Errors {
  alphabet: {
    isNonEmpty: Check<boolean>;
  };
  states: {
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

// TODO: Not sure whether to merge this with Errors
interface Warnings {
  states: {
    atLeastOneFinalState: Check<boolean>; // Warning
  };
  transitions: {
    isNonEmpty: Check<boolean>; // Warning
  };
}

// interface Messages {
//   alphabet: {
//     isNonEmpty: string;
//   };
//   states: {
//     areStateNamesNonEmpty: string;
//     areStateNamesUnique: string;
//     exactlyOneInitialState: string;
//     isNonEmpty: string;
//     atLeastOneFinalState: string;
//   };
//   transitions: {
//     areCurrentStatesNonEmpty: string;
//     areCurrentStatesValid: string;
//     areSymbolsNonEmpty: string;
//     areTransitionsUnique: string;
//     // statesIsNonEmpty: string;
//     // alphabetIsNonEmpty: string;
//     areSymbolsValid: string;
//     areNextStatesNonEmpty: string;
//     areNextStatesValid: string;
//     isNonEmpty: string;
//   };
// }

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

interface AlertText {
  alphabet: string[];
  states: string[];
  transitions: string[];
}

// For single boolean values, can compute error state by doing !(x1 && ... && xn)
// (each xi is a check)
// For lists, need to repeat this for each item in the lists
function createErrorStateList(errors: Check<boolean[]>[], disabled?: Check<boolean[]>): boolean[] {
  let l = errors[0].isValid;
  for (let i = 1; i < errors.length; i += 1) {
    l = R.zipWith((x, y) => x && y, l, errors[i].isValid);
  }
  l = R.map((x) => !x, l);

  if (disabled !== undefined) {
    l = R.zipWith((x, y) => x && y, disabled.isValid, l);
  }

  return l;
}

function createHelperText(c: Check<boolean>): string | null {
  return c.isValid ? null : c.message;
}

function createHelperTextList(c: Check<boolean[]>): (string | null)[] {
  return R.map((x) => (x ? null : c.message), c.isValid);
}

// Same idea as `createErrorStateList`
function createHelperTextListMultiple(errors: Check<boolean[]>[]): (string | null)[] {
  let l = createHelperTextList(errors[0]);
  for (let i = 1; i < errors.length; i += 1) {
    const helperText = createHelperTextList(errors[i]);
    l = R.zipWith((x, y) => (x === null ? y : x), l, helperText);
  }
  return l;
}

function createAlertTextList(checks: Check<boolean>[]): string[] {
  return R.filter((x: string | null) => x !== null,
    R.map((c) => (c.isValid ? null : c.message), checks)) as string[];
}

export function validate(alphabet: string[], states: State[], transitions: Transition[],
  initialStateId: string, finalStateIds: string[]) {
  const stateIds = R.map((s) => s.id, states);

  const errors: Errors = {
    alphabet: {
      isNonEmpty: {
        isValid: !R.isEmpty(alphabet),
        message: "Alphabet cannot be empty",
      },
    },
    states: {
      isNonEmpty: {
        isValid: !R.isEmpty(states),
        message: "At least one state is required",
      },
      areStateNamesNonEmpty: {
        isValid: R.map((s) => !R.isEmpty(s.name), states),
        message: "State name cannot be left blank",
      },
      areStateNamesUnique: {
        isValid: isUnique((s1, s2) => s2.name === s1.name, states),
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
        isValid: R.map((transition) => alphabet.includes(transition.symbol), transitions),
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
        isValid: isUnique((t1, t2) => (
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
    },
    transitions: {
      isNonEmpty: {
        isValid: !R.isEmpty(transitions),
        // eslint-disable-next-line no-nested-ternary
        message: !R.includes(initialStateId, stateIds) ? "There are no transitions" : (
          R.includes(initialStateId, finalStateIds)
            ? `There are no transitions and initial state "${findStateById(states, initialStateId)!.name}" is a final state, so all strings will be accepted by the automaton`
            : `There are no transitions and initial state "${findStateById(states, initialStateId)!.name}" is not a final state, so all strings will be rejected by the automaton`
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
      alphabet: !errors.alphabet.isNonEmpty,
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
      alphabet: createHelperText(errors.alphabet.isNonEmpty),
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
  const errorAlertText: AlertText = {
    alphabet: [],
    states: createAlertTextList([
      errors.states.isNonEmpty,
      errors.states.exactlyOneInitialState,
    ]),
    transitions: [],
  };

  // List of warning messages to display in an alert
  const warningAlertText: AlertText = {
    alphabet: [],
    states: createAlertTextList([
      warnings.states.atLeastOneFinalState,
    ]),
    transitions: createAlertTextList([
      warnings.transitions.isNonEmpty,
    ]),
  };

  return {
    errorState,
    helperText,
    errorAlertText,
    warningAlertText,
  };
}
