import React from "react";
import {makeStyles, Theme} from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import Checkbox from "@material-ui/core/Checkbox";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import Button from "@material-ui/core/Button";
import * as R from "ramda";
import {StatesErrorState, StatesHelperText} from "../core/validation";
import Dialog from "./Dialog";
import Transition from "../core/transition";
import State from "../core/state";

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
  onAddState,
  onRemoveState,
  onRemoveIncidentTransitions,
  onSetStateName,
  onSetInitialStateId,
  onSetFinalStateIds,
}: StatesInputProps) {
  const classes = useStyles();

  const [dialogInfo, setDialogInfo] = React.useState<{stateIndex: number, stateId: string} | null>(null);

  return (
    <>
      <form className={classes.root} autoComplete="off">
        {states.map((state, index) => (
          <React.Fragment key={state.id}>
            <TextField
              id={`state-name-${state.id}`}
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
                    setDialogInfo({
                      stateId: state.id,
                      stateIndex: index,
                    });
                  } else {
                    // Just remove the state
                    onRemoveState(index);
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
      <Dialog
        open={dialogInfo !== null}
        onClose={() => setDialogInfo(null)}
        title="Delete incident transitions?"
        message="One or more transitions refer to this state, so deleting this state may make these transitions invalid. Should these incident transitions be deleted?"
        buttons={[
          {
            content: "Cancel",
            onClick: () => setDialogInfo(null),
            color: "primary",
            autoFocus: false,
          },
          {
            content: "State only",
            onClick: () => {
              onRemoveState(dialogInfo!.stateIndex);
              setDialogInfo(null);
            },
            color: "primary",
            autoFocus: false,
          },
          {
            content: "State and transitions",
            onClick: () => {
              // TODO: Maybe merge this into one action (?)
              onRemoveIncidentTransitions(dialogInfo!.stateId);
              onRemoveState(dialogInfo!.stateIndex);
              setDialogInfo(null);
            },
            color: "primary",
            autoFocus: true,
          },
        ]}
      />
    </>
  );
}
