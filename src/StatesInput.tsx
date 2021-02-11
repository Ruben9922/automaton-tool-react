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
import Dialog from "./Dialog";
import Transition from "./transition";

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
  transitions: Transition[];
  initialStateId: string;
  finalStateIds: string[];
  errorState: StatesErrorState;
  helperText: StatesHelperText;
  errorAlertText: string[];
  warningAlertText: string[];
  openStateDeletedSnackbar: () => void;
  onAddState: () => void;
  onRemoveState: (index: number) => void;
  onRemoveIncidentTransitions: (stateId: string) => void;
  onSetStateName: (index: number, name: string) => void;
  onSetInitialStateId: (id: string) => void;
  onSetFinalStateIds: (id: string, isFinal: boolean) => void;
};

export default function StatesInput({
  states,
  transitions,
  initialStateId,
  finalStateIds,
  errorState,
  helperText,
  errorAlertText,
  warningAlertText,
  openStateDeletedSnackbar,
  onAddState,
  onRemoveState,
  onRemoveIncidentTransitions,
  onSetStateName,
  onSetInitialStateId,
  onSetFinalStateIds,
}: StatesInputProps) {
  const classes = useStyles();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [stateDeleteIndex, setStateDeleteIndex] = React.useState<number | null>(null);
  const [stateDelete, setStateDelete] = React.useState<State | null>(null);

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
              <IconButton
                onClick={() => {
                  const isUsedInTransitions = R.includes(state.id, R.chain((t: Transition) => (
                    R.append(t.currentState, t.nextStates)
                  ), transitions));

                  if (isUsedInTransitions) {
                    // Show dialog asking whether to remove incident transitions as well
                    setStateDelete(state);
                    setStateDeleteIndex(index);
                    setDialogOpen(true);
                  } else {
                    // Just remove the state
                    onRemoveState(index);
                    openStateDeletedSnackbar();
                  }
                }}
                aria-label="delete"
              >
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
      <Dialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        title="Delete incident transitions?"
        message="One or more transitions refer to this state, so deleting this state may make these transitions invalid. Should these incident transitions be deleted?"
        buttons={[
          {
            content: "Cancel",
            onClick: () => setDialogOpen(false),
            color: "primary",
            autoFocus: false,
          },
          {
            content: "State only",
            onClick: () => {
              onRemoveState(stateDeleteIndex as number);
              openStateDeletedSnackbar();
              setDialogOpen(false);
            },
            color: "primary",
            autoFocus: false,
          },
          {
            content: "State and transitions",
            onClick: () => {
              // TODO: Maybe merge this into one action (?)
              onRemoveIncidentTransitions((stateDelete as State).id);
              onRemoveState(stateDeleteIndex as number);
              openStateDeletedSnackbar();
              setDialogOpen(false);
            },
            color: "primary",
            autoFocus: true,
          },
        ]}
      />
    </>
  );
}
