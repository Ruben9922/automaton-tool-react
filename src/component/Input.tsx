import React from "react";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { useHistory } from "react-router-dom";
import { NIL, v4 as uuidv4 } from "uuid";
import { useImmerReducer } from "use-immer";
import * as R from "ramda";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Typography from "@material-ui/core/Typography";
import AlphabetInput from "./AlphabetInput";
import TransitionsInput from "./TransitionsInput";
import StatesInput from "./StatesInput";
import { validate } from "../core/validation";
import Transition from "../core/transition";
import firebase from "../firebase";
import Automaton, {
  automatonToDb,
  automatonToInputState,
  generatePlaceholderName,
  inputStateToAutomaton,
} from "../core/automaton";
import AutomatonDetailsInput from "./AutomatonDetailsInput";
import State from "../core/state";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: "100%",
  },
  button: {
    marginRight: theme.spacing(1),
  },
  backButton: {
    marginRight: theme.spacing(1),
  },
  completed: {
    display: "inline-block",
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

type InputProps = {
  automaton: Automaton | null;
  automatonIndex: number;
  automatonId: string | null;
  // addAutomaton: (automaton: Automaton) => void;
  onSnackbarOpen: (key: string) => void;
  openStateDeletedSnackbar: () => void;
  openTransitionDeletedSnackbar: () => void;
  user: firebase.User;
};

export type InputState = {
  name: string;
  alphabet: string[];
  states: State[];
  transitions: Transition[];
  initialStateId: string;
  finalStateIds: string[];
};

type Action =
  | { type: "setName", name: string }
  | { type: "setAlphabet", alphabet: string[] }
  | { type: "addState" }
  | { type: "removeState", index: number }
  | { type: "setStateName", index: number, name: string }
  | { type: "setInitialStateId", id: string }
  | { type: "setFinalStateIds", id: string, isFinal: boolean }
  | { type: "addTransition" }
  | { type: "removeTransition", index: number }
  | { type: "removeIncidentTransitions", stateId: string }
  | { type: "currentStateChange", index: number, stateId: string }
  | { type: "symbolChange", index: number, symbol: string | null }
  | { type: "nextStatesChange", index: number, stateIds: string[] };

function fixInitialStateId(initialStateId: string, states: State[]): string {
  return R.includes(initialStateId, R.map((state) => state.id, states)) ? initialStateId : NIL;
}

function fixFinalStateIds(finalStateIds: string[], states: State[]): string[] {
  return R.intersection(finalStateIds, R.map((state) => state.id, states));
}

// TODO: Maybe use mergeLeft() instead of forEach()
function fixTransitionCurrentStates(transitions: Transition[], states: State[]): Transition[] {
  return R.forEach((t) => {
    t.currentState = R.includes(t.currentState, R.map((state) => state.id, states)) ? t.currentState : "";
  }, transitions);
}

function fixTransitionSymbols(transitions: Transition[], alphabet: string[]): Transition[] {
  return R.forEach((t) => {
    t.symbol = t.symbol === null || R.includes(t.symbol, alphabet) ? t.symbol : "";
  }, transitions);
}

function fixTransitionNextStates(transitions: Transition[], states: State[]): Transition[] {
  return R.forEach((t) => {
    t.nextStates = R.intersection(t.nextStates, R.map((state) => state.id, states));
  }, transitions);
}

function reducer(draft: InputState, action: Action) {
  switch (action.type) {
    case "setName":
      draft.name = action.name;

      return;
    case "setAlphabet":
      draft.alphabet = action.alphabet;

      draft.transitions = fixTransitionSymbols(draft.transitions, draft.alphabet);
      return;
    case "addState":
      draft.states = R.append({
        id: uuidv4(),
        name: "",
      }, draft.states);

      draft.transitions = fixTransitionCurrentStates(draft.transitions, draft.states);
      draft.transitions = fixTransitionNextStates(draft.transitions, draft.states);
      draft.initialStateId = fixInitialStateId(draft.initialStateId, draft.states);
      draft.finalStateIds = fixFinalStateIds(draft.finalStateIds, draft.states);
      return;
    case "removeState":
      draft.states = R.remove(action.index, 1, draft.states);

      draft.transitions = fixTransitionCurrentStates(draft.transitions, draft.states);
      draft.transitions = fixTransitionNextStates(draft.transitions, draft.states);
      draft.initialStateId = fixInitialStateId(draft.initialStateId, draft.states);
      draft.finalStateIds = fixFinalStateIds(draft.finalStateIds, draft.states);
      return;
    case "setStateName":
      draft.states[action.index].name = action.name;
      return;
    case "setInitialStateId":
      draft.initialStateId = action.id;
      return;
    case "setFinalStateIds":
      draft.finalStateIds = action.isFinal
        ? R.union(draft.finalStateIds, [action.id])
        : R.difference(draft.finalStateIds, [action.id]);
      return;
    case "addTransition":
      draft.transitions = R.append({
        id: uuidv4(),
        currentState: "",
        symbol: "",
        nextStates: [],
      }, draft.transitions);
      return;
    case "removeTransition":
      draft.transitions = R.remove(action.index, 1, draft.transitions);
      return;
    case "removeIncidentTransitions":
      draft.transitions = R.filter((t: Transition) => (
        t.currentState !== action.stateId && !R.includes(action.stateId, t.nextStates)
      ), draft.transitions);
      return;
    case "currentStateChange":
      draft.transitions[action.index].currentState = action.stateId;
      return;
    case "symbolChange":
      draft.transitions[action.index].symbol = action.symbol;
      return;
    case "nextStatesChange":
      draft.transitions[action.index].nextStates = R.uniq(action.stateIds);
      return;
    default:
      throw new Error();
  }
}

export default function Input({
  automaton,
  automatonIndex,
  automatonId,
  // addAutomaton,
  onSnackbarOpen,
  openStateDeletedSnackbar,
  openTransitionDeletedSnackbar,
  user,
}: InputProps) {
  const classes = useStyles();

  const history = useHistory();

  const initialState: InputState = automaton ? automatonToInputState(automaton) : {
    name: "",
    alphabet: [],
    states: [],
    transitions: [],
    initialStateId: NIL,
    finalStateIds: [],
  };

  const [state, dispatch] = useImmerReducer(reducer, initialState);

  const {
    errorState, helperText, errorAlertText, warningAlertText,
  } = validate(
    state.alphabet,
    state.states,
    state.transitions,
    state.initialStateId,
    state.finalStateIds,
  );

  const redirect = (): void => {
    history.push(automatonId === null ? "/" : `/automata/${automatonId}`);
  };

  const handleFinish = (): void => {
    const updatedAutomaton = inputStateToAutomaton(state, automatonIndex);
    // addAutomaton(automaton);

    // Add to database
    const automataRef = firebase.database().ref(`/users/${user?.uid}/automata`);
    if (automaton && automatonId) {
      automataRef.child(automatonId).update(R.mergeLeft(automatonToDb(updatedAutomaton), {
        timeUpdated: Date.now(),
      }))
        .then(() => onSnackbarOpen("automatonUpdatedSuccess"), () => onSnackbarOpen("automatonUpdatedFailed"));
    } else {
      automataRef.push(R.mergeLeft(automatonToDb(updatedAutomaton), {
        timeAdded: Date.now(),
        timeUpdated: Date.now(),
      }))
        .then(() => onSnackbarOpen("automatonAddedSuccess"), () => onSnackbarOpen("automatonAddedFailed"));
    }

    redirect();
  };

  return (
    <div className={classes.root}>
      <Typography variant="h5" component="h1" gutterBottom>
        {automaton === null ? "Create Automaton" : "Edit Automaton"}
      </Typography>
      <AutomatonDetailsInput
        name={state.name}
        placeholderName={generatePlaceholderName(automatonIndex)}
        onNameChange={(name) => dispatch({ type: "setName", name })}
      />
      <Typography variant="h6" component="h2" gutterBottom>
        Alphabet
      </Typography>
      <AlphabetInput
        alphabet={state.alphabet}
        errorState={errorState.alphabet}
        helperText={helperText.alphabet}
        onSetAlphabet={(alphabet) => dispatch({ type: "setAlphabet", alphabet })}
      />
      <Typography variant="h6" component="h2" gutterBottom>
        States
      </Typography>
      <StatesInput
        states={state.states}
        transitions={state.transitions}
        initialStateId={state.initialStateId}
        finalStateIds={state.finalStateIds}
        errorState={errorState.states}
        helperText={helperText.states}
        onAddState={() => dispatch({ type: "addState" })}
        onRemoveState={(index) => {
          dispatch({ type: "removeState", index });
          openStateDeletedSnackbar();
        }}
        onRemoveIncidentTransitions={(stateId) => dispatch({ type: "removeIncidentTransitions", stateId })}
        onSetStateName={(index, name) => dispatch({ type: "setStateName", index, name })}
        onSetInitialStateId={(id) => dispatch({ type: "setInitialStateId", id })}
        onSetFinalStateIds={(id, isFinal) => dispatch({ type: "setFinalStateIds", id, isFinal })}
      />
      <Typography variant="h6" component="h2" gutterBottom>
        Transitions
      </Typography>
      <TransitionsInput
        transitions={state.transitions}
        alphabet={state.alphabet}
        states={state.states}
        errorState={errorState.transitions}
        helperText={helperText.transitions}
        onAddTransition={() => dispatch({ type: "addTransition" })}
        onRemoveTransition={(index) => {
          dispatch({ type: "removeTransition", index });
          openTransitionDeletedSnackbar();
        }}
        onCurrentStateChange={(index, stateId) => dispatch({ type: "currentStateChange", index, stateId })}
        onSymbolChange={(index, symbol) => dispatch({ type: "symbolChange", index, symbol })}
        onNextStatesChange={(index, stateIds) => dispatch({ type: "nextStatesChange", index, stateIds })}
      />
      <Button variant="contained" color="primary" onClick={handleFinish} disabled={!R.isEmpty(errorAlertText)}>
        Save
      </Button>
      <Button variant="contained" color="default" onClick={redirect}>
        Cancel
      </Button>
      {R.isEmpty(errorAlertText) || (
        <Alert severity="error">
          <AlertTitle>{errorAlertText.length} {errorAlertText.length === 1 ? "error" : "errors"}</AlertTitle>
          <ul>
            {errorAlertText.map((message: string, index: number) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={index}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}
      {R.isEmpty(warningAlertText) || (
        <Alert severity="warning">
          <AlertTitle>{warningAlertText.length} {warningAlertText.length === 1 ? "warning" : "warnings"}</AlertTitle>
          <ul>
            {warningAlertText.map((message: string, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={index}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
}
