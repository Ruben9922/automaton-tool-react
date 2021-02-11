import React from 'react';
import { makeStyles, Theme } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Step from "@material-ui/core/Step";
import StepButton from "@material-ui/core/StepButton";
import Stepper from "@material-ui/core/Stepper";
import { useHistory } from "react-router-dom";
import { StepLabel } from "@material-ui/core";
import { NIL, v4 as uuidv4 } from "uuid";
import { useImmerReducer } from "use-immer";
import * as R from "ramda";
import AlphabetInput from "./AlphabetInput";
import TransitionsInput from "./TransitionsInput";
import StatesInput from "./StatesInput";
import {
  AlphabetErrorState,
  StatesErrorState,
  TransitionsErrorState,
  validate,
} from "./validation";
import Transition from "./transition";
import State from "./state";
import Automaton from "./automaton";
import { alphabetPresets } from './alphabetPreset';
import { getIds } from './utilities';

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
  addAutomaton: (automaton: Automaton) => void;
  openAutomatonAddedSnackbar: () => void;
  openStateDeletedSnackbar: () => void;
  openTransitionDeletedSnackbar: () => void;
};

type InputState = {
  alphabet: string[];
  alphabetPresetIndex: number | "";
  states: State[];
  transitions: Transition[];
  initialStateId: string;
  finalStateIds: string[];
};

type Action =
  | { type: "setAlphabetPresetIndex", index: number | "" }
  | { type: "setAlphabet", alphabetString: string }
  | { type: "addState" }
  | { type: "removeState", index: number }
  | { type: "setStateName", index: number, name: string }
  | { type: "setInitialStateId", id: string }
  | { type: "setFinalStateIds", id: string, isFinal: boolean }
  | { type: "addTransition" }
  | { type: "removeTransition", index: number }
  | { type: "removeIncidentTransitions", stateId: string }
  | { type: "currentStateChange", index: number, stateId: string }
  | { type: "symbolChange", index: number, symbol: string }
  | { type: "nextStatesChange", index: number, stateIds: string[] };

const initialState: InputState = {
  alphabet: [],
  alphabetPresetIndex: "",
  states: [],
  transitions: [],
  initialStateId: NIL,
  finalStateIds: [],
};

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

function fixTransitionCurrentStates(transitions: Transition[], stateIds: string[]): Transition[] {
  return R.forEach((t) => {
    t.currentState = R.includes(t.currentState, stateIds) ? t.currentState : "";
  }, transitions);
}

function fixTransitionSymbols(transitions: Transition[], alphabet: string[]): Transition[] {
  return R.forEach((t) => {
    t.symbol = R.includes(t.symbol, alphabet) ? t.symbol : "";
  }, transitions);
}

function fixTransitionNextStates(transitions: Transition[], stateIds: string[]): Transition[] {
  return R.forEach((t) => {
    t.nextStates = R.intersection(t.nextStates, stateIds);
  }, transitions);
}

function reducer(draft: InputState, action: Action) {
  switch (action.type) {
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
      draft.states = R.append({
        id: uuidv4(),
        name: "",
      }, draft.states);

      draft.transitions = fixTransitionCurrentStates(draft.transitions, getIds(draft.states));
      draft.transitions = fixTransitionNextStates(draft.transitions, getIds(draft.states));
      draft.initialStateId = fixInitialStateId(draft.initialStateId, getIds(draft.states));
      draft.finalStateIds = fixFinalStateIds(draft.finalStateIds, getIds(draft.states));
      return;
    case "removeState":
      draft.states = R.remove(action.index, 1, draft.states);

      draft.transitions = fixTransitionCurrentStates(draft.transitions, getIds(draft.states));
      draft.transitions = fixTransitionNextStates(draft.transitions, getIds(draft.states));
      draft.initialStateId = fixInitialStateId(draft.initialStateId, getIds(draft.states));
      draft.finalStateIds = fixFinalStateIds(draft.finalStateIds, getIds(draft.states));
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
  addAutomaton,
  openAutomatonAddedSnackbar,
  openStateDeletedSnackbar,
  openTransitionDeletedSnackbar,
}: InputProps) {
  const classes = useStyles();

  const history = useHistory();

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
      onAddState={() => dispatch({ type: "addState" })}
      onRemoveState={(index) => {
        dispatch({ type: "removeState", index });
        openStateDeletedSnackbar();
      }}
      onRemoveIncidentTransitions={(stateId) => dispatch({ type: "removeIncidentTransitions", stateId })}
      onSetStateName={(index, name) => dispatch({ type: "setStateName", index, name })}
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
      onAddTransition={() => dispatch({ type: "addTransition" })}
      onRemoveTransition={(index) => {
        dispatch({ type: "removeTransition", index });
        openTransitionDeletedSnackbar();
      }}
      onCurrentStateChange={(index, stateId) => dispatch({ type: "currentStateChange", index, stateId })}
      onSymbolChange={(index, symbol) => dispatch({ type: "symbolChange", index, symbol })}
      onNextStatesChange={(index, stateIds) => dispatch({ type: "nextStatesChange", index, stateIds })}
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
    },
    {
      id: uuidv4(),
      label: "Specify transitions",
      completed: countErrors(errorState.transitions, errorAlertText.transitions) === 0,
      errorCount: countErrors(errorState.transitions, errorAlertText.transitions),
      warningCount: warningAlertText.transitions.length,
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
    const automaton = Automaton.createAutomaton(state.alphabet, state.states, state.transitions,
      state.initialStateId, state.finalStateIds);
    addAutomaton(automaton);
    history.push("/");
    openAutomatonAddedSnackbar();
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
    </div>
  );
}
