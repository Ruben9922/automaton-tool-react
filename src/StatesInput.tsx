import React from "react";
import { makeStyles, Theme } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import Checkbox from "@material-ui/core/Checkbox";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import Button from "@material-ui/core/Button";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import * as R from "ramda";
import State from "./state";
import { StatesErrorState, StatesHelperText } from "./validation";

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
}));

type StatesInputProps = {
  states: State[];
  initialStateId: string;
  finalStateIds: string[];
  errorState: StatesErrorState;
  helperText: StatesHelperText;
  errorAlertText: string[];
  warningAlertText: string[];
  onAddState: () => void;
  onRemoveState: (index: number) => void;
  onSetStateName: (index: number, name: string) => void;
  onSetInitialStateId: (id: string) => void;
  onSetFinalStateIds: (id: string, isFinal: boolean) => void;
};

export default function StatesInput({
  states,
  initialStateId,
  finalStateIds,
  errorState,
  helperText,
  errorAlertText,
  warningAlertText,
  onAddState,
  onRemoveState,
  onSetStateName,
  onSetInitialStateId,
  onSetFinalStateIds,
}: StatesInputProps) {
  const classes = useStyles();

  return (
    <>
      <form className={classes.root} autoComplete="off">
        {states.map((state: State, index: number) => (
          <React.Fragment key={state.id}>
            <TextField
              id={`state-name-${index + 1}`}
              label={`State ${index + 1} name`}
              value={state.name}
              onChange={(event) => onSetStateName(index, event.target.value)}
              error={errorState.stateName[index]}
              helperText={helperText.stateName[index]}
            />
            <FormControlLabel
              control={(
                <Radio
                  checked={initialStateId === state.id}
                  value={state.id}
                  onChange={(event) => onSetInitialStateId(event.target.value)}
                />
              )}
              label="Initial"
            />
            <FormControlLabel
              control={(
                <Checkbox
                  checked={R.includes(state.id, finalStateIds)}
                  onChange={(event) => onSetFinalStateIds(state.id, event.target.checked)}
                  name={`state-${index + 1}-final`}
                />
              )}
              label="Final"
            />
            <Tooltip title={`Delete State ${index + 1}`}>
              <IconButton onClick={() => onRemoveState(index)} aria-label="delete">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </React.Fragment>
        ))}
        <Button onClick={onAddState} variant="contained">Add state</Button>
      </form>
      {R.isEmpty(errorAlertText) || (
        <Alert severity="error">
          <AlertTitle>{errorAlertText.length === 1 ? "Error" : "Errors"}</AlertTitle>
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
          <AlertTitle>{warningAlertText.length === 1 ? "Warning" : "Warnings"}</AlertTitle>
          <ul>
            {warningAlertText.map((message: string, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={index}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}
    </>
  );
}
