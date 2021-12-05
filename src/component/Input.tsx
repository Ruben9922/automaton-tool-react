import React from 'react';
import {makeStyles, Theme} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Step from "@material-ui/core/Step";
import StepButton from "@material-ui/core/StepButton";
import Stepper from "@material-ui/core/Stepper";
import {useHistory} from "react-router-dom";
import {StepLabel} from "@material-ui/core";
import {NIL, v4 as uuidv4} from "uuid";
import {useImmerReducer} from "use-immer";
import * as R from "ramda";
import AddIcon from "@material-ui/icons/Add";
import AlphabetInput from "./AlphabetInput";
import TransitionsInput from "./TransitionsInput";
import StatesInput from "./StatesInput";
import {AlphabetErrorState, StatesErrorState, TransitionsErrorState, validate,} from "../core/validation";
import Transition from "../core/transition";
import {alphabetPresets} from '../core/alphabetPreset';
import firebase from '../firebase';
import Automaton, {
  automatonToDb,
  automatonToInputState,
  generatePlaceholderName,
  inputStateToAutomaton
} from "../core/automaton";
import AutomatonDetailsInput from "./AutomatonDetailsInput";
import MultipleFabs, {FabProps} from "./MultipleFabs";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
  },
  button: {
    marginRight: theme.spacing(1),
  },
  backButton: {
    marginRight: theme.spacing(1),
  },
  completed: {
    display: 'inline-block',
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
};

export type InputState = {
  name: string;
  alphabet: string[];
  alphabetPresetIndex: number | "";
  states: Map<string, string>;
  transitions: Transition[];
  initialStateId: string;
  finalStateIds: string[];
};

type Action =
  | { type: "setName", name: string }
  | { type: "setAlphabetPresetIndex", index: number | "" }
  | { type: "setAlphabet", alphabetString: string }
  | { type: "addState" }
  | { type: "removeState", id: string }
  | { type: "setStateName", id: string, name: string }
  | { type: "setInitialStateId", id: string }
  | { type: "setFinalStateIds", id: string, isFinal: boolean }
  | { type: "addTransition" }
  | { type: "removeTransition", index: number }
  | { type: "removeIncidentTransitions", stateId: string }
  | { type: "currentStateChange", index: number, stateId: string }
  | { type: "symbolChange", index: number, symbol: string | null }
  | { type: "nextStatesChange", index: number, stateIds: string[] };

function alphabetToAlphabetPresetIndex(a: string[]): number {
  // Check if the entered alphabet matches the alphabet of a preset
  // If so, select this preset
  // (Ignoring order and repeats, hence sorting and removing duplicates)
  const likeSet = R.pipe(R.sortBy(R.identity), R.uniq);
  let updatedAlphabetPresetIndex = R.findIndex((alphabetPreset) => (
    R.equals(likeSet(alphabetPreset.alphabet), likeSet(a))
  ), alphabetPresets);

  // If it doesn't match a preset, then use the custom preset (whose index is 5)
  if (updatedAlphabetPresetIndex === -1) {
    updatedAlphabetPresetIndex = 5;
  }

  return updatedAlphabetPresetIndex;
}

function fixInitialStateId(initialStateId: string, stateIds: string[]): string {
  return R.includes(initialStateId, stateIds) ? initialStateId : NIL;
}

function fixFinalStateIds(finalStateIds: string[], stateIds: string[]): string[] {
  return R.intersection(finalStateIds, stateIds);
}

// TODO: Maybe use mergeLeft() instead of forEach()
function fixTransitionCurrentStates(transitions: Transition[], stateIds: string[]): Transition[] {
  return R.forEach((t) => {
    t.currentState = R.includes(t.currentState, stateIds) ? t.currentState : "";
  }, transitions);
}

function fixTransitionSymbols(transitions: Transition[], alphabet: string[]): Transition[] {
  return R.forEach((t) => {
    t.symbol = t.symbol === null || R.includes(t.symbol, alphabet) ? t.symbol : "";
  }, transitions);
}

function fixTransitionNextStates(transitions: Transition[], stateIds: string[]): Transition[] {
  return R.forEach((t) => {
    t.nextStates = R.intersection(t.nextStates, stateIds);
  }, transitions);
}

function reducer(draft: InputState, action: Action) {
  switch (action.type) {
    case "setName":
      draft.name = action.name;

      return;
    case "setAlphabetPresetIndex":
      draft.alphabetPresetIndex = action.index;

      if (draft.alphabetPresetIndex !== "") {
        draft.alphabet = alphabetPresets[draft.alphabetPresetIndex].alphabet;
      }
      return;
    case "setAlphabet":
      draft.alphabet = action.alphabetString.split("");

      draft.alphabetPresetIndex = alphabetToAlphabetPresetIndex(draft.alphabet);
      draft.transitions = fixTransitionSymbols(draft.transitions, draft.alphabet);
      return;
    case "addState":
      draft.states.set(uuidv4(), "");

      draft.transitions = fixTransitionCurrentStates(draft.transitions,
        Array.from(draft.states.keys()));
      draft.transitions = fixTransitionNextStates(draft.transitions,
        Array.from(draft.states.keys()));
      draft.initialStateId = fixInitialStateId(draft.initialStateId,
        Array.from(draft.states.keys()));
      draft.finalStateIds = fixFinalStateIds(draft.finalStateIds, Array.from(draft.states.keys()));
      return;
    case "removeState":
      draft.states.delete(action.id);

      draft.transitions = fixTransitionCurrentStates(draft.transitions,
        Array.from(draft.states.keys()));
      draft.transitions = fixTransitionNextStates(draft.transitions,
        Array.from(draft.states.keys()));
      draft.initialStateId = fixInitialStateId(draft.initialStateId,
        Array.from(draft.states.keys()));
      draft.finalStateIds = fixFinalStateIds(draft.finalStateIds, Array.from(draft.states.keys()));
      return;
    case "setStateName":
      draft.states.set(action.id, action.name);
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
}: InputProps) {
  const classes = useStyles();

  const history = useHistory();

  const initialState: InputState = automaton ? R.mergeLeft(automatonToInputState(automaton), {
    alphabetPresetIndex: alphabetToAlphabetPresetIndex(automatonToInputState(automaton).alphabet),
  }) : {
    name: "",
    alphabet: [],
    alphabetPresetIndex: "",
    states: new Map(),
    transitions: [],
    initialStateId: NIL,
    finalStateIds: [],
  };

  const [state, dispatch] = useImmerReducer(reducer, initialState);
  const [activeStepIndex, setActiveStepIndex] = React.useState(0);

  const {
    errorState, helperText, errorAlertText, warningAlertText,
  } = validate(state.alphabet, state.states, state.transitions, state.initialStateId,
    state.finalStateIds);

  const stepContent = [
    <AlphabetInput
      alphabet={state.alphabet}
      alphabetPresetIndex={state.alphabetPresetIndex}
      errorState={errorState.alphabet}
      helperText={helperText.alphabet}
      onSetAlphabetPresetIndex={(index) => dispatch({ type: "setAlphabetPresetIndex", index })}
      onSetAlphabet={(alphabetString) => dispatch({ type: "setAlphabet", alphabetString })}
    />,
    <StatesInput
      states={state.states}
      transitions={state.transitions}
      initialStateId={state.initialStateId}
      finalStateIds={state.finalStateIds}
      errorState={errorState.states}
      helperText={helperText.states}
      errorAlertText={errorAlertText.states}
      warningAlertText={warningAlertText.states}
      onRemoveState={(id) => {
        dispatch({ type: "removeState", id });
        openStateDeletedSnackbar();
      }}
      onRemoveIncidentTransitions={(stateId) => dispatch({ type: "removeIncidentTransitions", stateId })}
      onSetStateName={(id, name) => dispatch({ type: "setStateName", id, name })}
      onSetInitialStateId={(id) => dispatch({ type: "setInitialStateId", id })}
      onSetFinalStateIds={(id, isFinal) => dispatch({ type: "setFinalStateIds", id, isFinal })}
    />,
    <TransitionsInput
      transitions={state.transitions}
      alphabet={state.alphabet}
      states={state.states}
      errorState={errorState.transitions}
      helperText={helperText.transitions}
      warningAlertText={warningAlertText.transitions}
      onRemoveTransition={(index) => {
        dispatch({ type: "removeTransition", index });
        openTransitionDeletedSnackbar();
      }}
      onCurrentStateChange={(index, stateId) => dispatch({ type: "currentStateChange", index, stateId })}
      onSymbolChange={(index, symbol) => dispatch({ type: "symbolChange", index, symbol })}
      onNextStatesChange={(index, stateIds) => dispatch({ type: "nextStatesChange", index, stateIds })}
    />,
    <AutomatonDetailsInput
      name={state.name}
      placeholderName={generatePlaceholderName(automatonIndex)}
      onNameChange={(name) => dispatch({ type: "setName", name })}
    />,
  ];

  // TODO: Maybe find a better way of doing this
  const countErrors = (errorState1: AlphabetErrorState | StatesErrorState | TransitionsErrorState,
    errorAlertText1: string[]): number => (
    R.length(R.filter((x) => x === true, R.flatten([R.values(errorState1)])))
      + R.length(errorAlertText1)
  );

  interface InputStep {
    id: string;
    label: string;
    completed: boolean;
    errorCount: number;
    warningCount: number;
    fab?: FabProps;
  }

  const steps: InputStep[] = [
    {
      id: uuidv4(),
      label: "Specify alphabet",
      completed: countErrors(errorState.alphabet, errorAlertText.alphabet) === 0,
      errorCount: countErrors(errorState.alphabet, errorAlertText.alphabet),
      warningCount: 0,
    },
    {
      id: uuidv4(),
      label: "Specify states",
      completed: countErrors(errorState.states, errorAlertText.states) === 0,
      errorCount: countErrors(errorState.states, errorAlertText.states),
      warningCount: warningAlertText.states.length,
      fab: {
        tooltip: "Add state",
        icon: <AddIcon />,
        action: () => dispatch({ type: "addState" }),
        label: "add-state",
      },
    },
    {
      id: uuidv4(),
      label: "Specify transitions",
      completed: countErrors(errorState.transitions, errorAlertText.transitions) === 0,
      errorCount: countErrors(errorState.transitions, errorAlertText.transitions),
      warningCount: warningAlertText.transitions.length,
      fab: {
        tooltip: "Add transition",
        icon: <AddIcon />,
        action: () => dispatch({ type: "addTransition" }),
        label: "add-transition",
      },
    },
    {
      id: uuidv4(),
      label: "Specify final details",
      completed: true,
      errorCount: 0,
      warningCount: 0,
    },
  ];

  const allStepsCompleted = (): boolean => steps.every((step) => step.completed);

  const handleNext = (): void => {
    // It's the last step, but not all steps have been completed
    // find the first step that has not been completed
    const updatedActiveStepIndex = activeStepIndex === steps.length - 1 && !allStepsCompleted()
      ? steps.findIndex((step) => !step.completed)
      : activeStepIndex + 1;

    setActiveStepIndex(updatedActiveStepIndex);
  };

  const handleBack = (): void => setActiveStepIndex((prevActiveStep) => prevActiveStep - 1);

  const handleStep = (stepIndex: number) => (): void => setActiveStepIndex(stepIndex);

  const handleFinish = (): void => {
    const updatedAutomaton = inputStateToAutomaton(state, automatonIndex);
    // addAutomaton(automaton);

    // Add to database
    const automataRef = firebase.database().ref("automata");
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

    history.push("/");
  };

  return (
    <div className={classes.root}>
      <Stepper alternativeLabel nonLinear activeStep={activeStepIndex} style={{ backgroundColor: "transparent" }}>
        {steps.map((step, index) => (
          <Step key={step.id}>
            <StepButton
              onClick={handleStep(index)}
              completed={step.completed}
              optional={(step.errorCount !== 0 && (
                <Typography variant="caption" color="error">
                  {`${step.errorCount} ${step.errorCount === 1 ? "error" : "errors"}`}
                </Typography>
              )) || (step.warningCount !== 0 && (
                <Typography variant="caption">
                  {`${step.warningCount} ${step.warningCount === 1 ? "warning" : "warnings"}`}
                </Typography>
              ))}
            >
              <StepLabel error={step.errorCount > 0}>{step.label}</StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
      {stepContent[activeStepIndex]}
      <Button disabled={activeStepIndex === 0} onClick={handleBack} className={classes.button}>
        Back
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={handleNext}
        className={classes.button}
        disabled={activeStepIndex === steps.length - 1 && allStepsCompleted()}
      >
        Next
      </Button>
      <Button variant="contained" color="primary" onClick={handleFinish} disabled={!allStepsCompleted()}>
        Finish
      </Button>
      <MultipleFabs fabs={R.map((s) => s.fab, steps)} openFabIndex={activeStepIndex} />
    </div>
  );
}
