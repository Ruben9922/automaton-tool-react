import React from "react";
import { makeStyles, Theme } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Input from "@material-ui/core/Input";
import { FormHelperText } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import clsx from "clsx";
import * as R from "ramda";
import Transition from "./transition";
import State from "./state";
import { findStateById } from "./utilities";
import { TransitionsErrorState, TransitionsHelperText } from "./validation";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
      width: '25ch',
    },
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
  placeholderStateName: {
    fontStyle: "italic",
  },
  selected: {
    fontWeight: theme.typography.fontWeightMedium,
  },
}));

type TransitionsInputProps = {
  transitions: Transition[];
  alphabet: string[];
  states: State[];
  errorState: TransitionsErrorState;
  helperText: TransitionsHelperText;
  warningAlertText: string[];
  onAddTransition: () => void;
  onRemoveTransition: (index: number) => void;
  onCurrentStateChange: (index: number, stateId: string) => void;
  onSymbolChange: (index: number, symbol: string) => void;
  onNextStatesChange: (index: number, stateIds: string[]) => void;
};

export default function TransitionsInput({
  transitions,
  alphabet,
  states,
  errorState,
  helperText,
  warningAlertText,
  onAddTransition,
  onRemoveTransition,
  onCurrentStateChange,
  onSymbolChange,
  onNextStatesChange,
}: TransitionsInputProps) {
  const classes = useStyles();

  const generatePlaceholderStateName = (index: number): string => `[State ${index + 1}]`;

  const createStateDisplayName = (state: State, index: number): string => (
    state.name === "" ? generatePlaceholderStateName(index) : state.name
  );

  return (
    <>
      <form className={classes.root} autoComplete="off">
        {transitions.map((transition: Transition, transitionIndex: number) => (
          <React.Fragment key={transition.id}>
            <FormControl
              className={classes.formControl}
              error={errorState.currentState[transitionIndex]}
              disabled={R.isEmpty(states)}
            >
              <InputLabel id={`transition-current-state-${transitionIndex + 1}-label`}>Current state</InputLabel>
              <Select
                labelId={`transition-current-state-${transitionIndex + 1}-label`}
                id={`transition-current-state-${transitionIndex + 1}`}
                value={transition.currentState}
                onChange={(event) => (
                  onCurrentStateChange(transitionIndex, event.target.value as string)
                )}
              >
                {states.map((state: State, stateIndex: number) => (
                  <MenuItem
                    key={state.id}
                    value={state.id}
                    className={clsx({ [classes.placeholderStateName]: state.name === "" })}
                  >
                    {createStateDisplayName(state, stateIndex)}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{helperText.currentState[transitionIndex]}</FormHelperText>
            </FormControl>
            <FormControl
              className={classes.formControl}
              error={errorState.symbol[transitionIndex]}
              disabled={R.isEmpty(alphabet)}
            >
              <InputLabel id={`transition-symbol-${transitionIndex + 1}-label`}>Symbol</InputLabel>
              <Select
                labelId={`transition-symbol-${transitionIndex + 1}-label`}
                id={`transition-symbol-${transitionIndex + 1}`}
                value={transition.symbol}
                onChange={(event) => onSymbolChange(transitionIndex, event.target.value as string)}
              >
                {alphabet.map((symbol: string, index: number) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <MenuItem key={index} value={symbol}>{symbol}</MenuItem>
                ))}
              </Select>
              <FormHelperText>{helperText.symbol[transitionIndex]}</FormHelperText>
            </FormControl>
            <FormControl
              className={classes.formControl}
              error={errorState.nextStates[transitionIndex]}
              disabled={R.isEmpty(states)}
            >
              <InputLabel id={`transition-next-states-${transitionIndex + 1}-label`}>Next states</InputLabel>
              <Select
                labelId={`transition-next-states-${transitionIndex + 1}-label`}
                id={`transition-next-states-${transitionIndex + 1}`}
                multiple
                value={transition.nextStates}
                onChange={(event) => onNextStatesChange(transitionIndex,
                  event.target.value as string[])}
                input={<Input id="transition-next-states-select" />}
                renderValue={(value: unknown) => {
                  const nextStateIds = value as Array<string>;
                  return (
                    <div className={classes.chips}>
                      {nextStateIds.map((nextStateId: string) => {
                        const state = findStateById(states, nextStateId) as State;
                        const stateIndex = states.findIndex((s) => s.id === nextStateId);
                        return (
                          <Chip
                            key={nextStateId}
                            label={createStateDisplayName(state, stateIndex)}
                            className={clsx(classes.chip, { [classes.placeholderStateName]: state.name === "" })}
                          />
                        );
                      })}
                    </div>
                  );
                }}
              >
                {states.map((state: State, index: number) => (
                  <MenuItem
                    key={state.id}
                    value={state.id}
                    className={clsx({
                      [classes.placeholderStateName]: state.name === "",
                      [classes.selected]: transition.nextStates.includes(state.id),
                    })}
                  >
                    {createStateDisplayName(state, index)}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{helperText.nextStates[transitionIndex]}</FormHelperText>
            </FormControl>
            <Tooltip title={`Delete Transition ${transitionIndex + 1}`}>
              <IconButton onClick={() => onRemoveTransition(transitionIndex)} aria-label="delete">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </React.Fragment>
        ))}
        <Button onClick={onAddTransition} variant="contained">Add transition</Button>
      </form>
      {R.isEmpty(warningAlertText) || (
        <Alert severity="warning">
          <AlertTitle>{warningAlertText.length === 1 ? "Warning" : "Warnings"}</AlertTitle>
          <ul>
            {warningAlertText.map((message, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={index}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}
    </>
  );
}