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
import { StatesErrorState, StatesHelperText } from "./validation";
import Dialog from "./Dialog";
import Transition from "./transition";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";

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
  states: Map<string, string>;
  transitions: Transition[];
  initialStateId: string;
  finalStateIds: string[];
  errorState: StatesErrorState;
  helperText: StatesHelperText;
  errorAlertText: string[];
  warningAlertText: string[];
  onRemoveState: (id: string) => void;
  onRemoveIncidentTransitions: (stateId: string) => void;
  onSetStateName: (id: string, name: string) => void;
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
  onRemoveState,
  onRemoveIncidentTransitions,
  onSetStateName,
  onSetInitialStateId,
  onSetFinalStateIds,
}: StatesInputProps) {
  const classes = useStyles();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [stateDeleteKey, setStateDeleteKey] = React.useState<string | null>(null);

  return (
    <>
      <form className={classes.root} autoComplete="off">
        {Array.from(states.entries()).map(([key, state]: [string, string], index: number) => (
          <React.Fragment key={key}>
            <TextField
              id={`state-name-${key}`}
              label={`State ${index + 1} name`}
              value={state}
              onChange={(event) => onSetStateName(key, event.target.value)}
              error={errorState.stateName[index]}
              helperText={helperText.stateName[index]}
            />
            <FormControlLabel
              control={(
                <Radio
                  checked={initialStateId === key}
                  value={key}
                  onChange={(event) => onSetInitialStateId(event.target.value)}
                />
              )}
              label="Initial"
            />
            <FormControlLabel
              control={(
                <Checkbox
                  checked={R.includes(key, finalStateIds)}
                  onChange={(event) => onSetFinalStateIds(key, event.target.checked)}
                  name={`state-${index + 1}-final`}
                />
              )}
              label="Final"
            />
            <Tooltip title={`Delete State ${index + 1}`}>
              <IconButton
                onClick={() => {
                  const isUsedInTransitions = R.includes(key, R.chain((t: Transition) => (
                    R.append(t.currentState, t.nextStates)
                  ), transitions));

                  if (isUsedInTransitions) {
                    // Show dialog asking whether to remove incident transitions as well
                    setStateDeleteKey(key);
                    setDialogOpen(true);
                  } else {
                    // Just remove the state
                    onRemoveState(key);
                  }
                }}
                aria-label="delete"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </React.Fragment>
        ))}
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
              onRemoveState(stateDeleteKey!);
              setDialogOpen(false);
            },
            color: "primary",
            autoFocus: false,
          },
          {
            content: "State and transitions",
            onClick: () => {
              // TODO: Maybe merge this into one action (?)
              onRemoveIncidentTransitions(stateDeleteKey!);
              onRemoveState(stateDeleteKey!);
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
