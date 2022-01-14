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
import clsx from "clsx";
import * as R from "ramda";
import Transition from "../core/transition";
import State, { createStateDisplayName, stateIdToStateIndex, stateIdToStateName } from "../core/state";
import { TransitionsErrorState, TransitionsHelperText } from "../core/validation";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
      width: "25ch",
    },
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
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
  onAddTransition: () => void;
  onRemoveTransition: (index: number) => void;
  onCurrentStateChange: (index: number, stateId: string) => void;
  onSymbolChange: (index: number, symbol: string | null) => void;
  onNextStatesChange: (index: number, stateIds: string[]) => void;
};

export default function TransitionsInput({
  transitions,
  alphabet,
  states,
  errorState,
  helperText,
  onAddTransition,
  onRemoveTransition,
  onCurrentStateChange,
  onSymbolChange,
  onNextStatesChange,
}: TransitionsInputProps) {
  const classes = useStyles();

  // TODO: Add ID to alphabet
  const symbols = R.prepend(null, alphabet);

  return (
    <form className={classes.root} autoComplete="off" onSubmit={(event) => event.preventDefault()}>
      {R.isEmpty(transitions) ? (
        <p>
          No transitions.
        </p>
      ) : transitions.map((transition: Transition, transitionIndex: number) => (
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
                  {createStateDisplayName(state.name, stateIndex)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{helperText.currentState[transitionIndex]}</FormHelperText>
          </FormControl>
          <FormControl
            className={classes.formControl}
            error={errorState.symbol[transitionIndex]}
          >
            <InputLabel id={`transition-symbol-${transitionIndex + 1}-label`}>Symbol</InputLabel>
            <Select
              labelId={`transition-symbol-${transitionIndex + 1}-label`}
              id={`transition-symbol-${transitionIndex + 1}`}
              value={transition.symbol ?? "<<epsilon>>"}
              onChange={(event) => onSymbolChange(transitionIndex, (event.target.value as string) === "<<epsilon>>" ? null : event.target.value as string)}
            >
              {symbols.map((symbol: string | null, index: number) => (
                // eslint-disable-next-line react/no-array-index-key
                <MenuItem key={index} value={symbol ?? "<<epsilon>>"}>{symbol ?? "ε"}</MenuItem>
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
              value={R.sortBy(R.curry(stateIdToStateIndex)(states), transition.nextStates)}
              onChange={(event) => (
                onNextStatesChange(transitionIndex, event.target.value as string[])
              )}
              input={<Input id="transition-next-states-select" />}
              renderValue={(value: unknown) => {
                const nextStateIds = value as Array<string>;
                return (
                  <div className={classes.chips}>
                    {nextStateIds.map((nextStateId: string) => {
                      const stateName = stateIdToStateName(nextStateId, states);
                      const stateIndex = stateIdToStateIndex(states, nextStateId);
                      return (
                        <Chip
                          key={nextStateId}
                          label={createStateDisplayName(stateName, stateIndex)}
                          className={clsx(classes.chip, { [classes.placeholderStateName]: stateName === "" })}
                        />
                      );
                    })}
                  </div>
                );
              }}
            >
              {states.map((state: State, stateIndex: number) => (
                <MenuItem
                  key={state.id}
                  value={state.id}
                  className={clsx({
                    [classes.placeholderStateName]: state.name === "",
                    [classes.selected]: transition.nextStates.includes(state.id),
                  })}
                >
                  {createStateDisplayName(state.name, stateIndex)}
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
  );
}
