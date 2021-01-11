import React from "react";
import {Record} from "immutable";
import {makeStyles} from "@material-ui/core/styles";
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
import {v4 as uuidv4} from "uuid";

const useStyles = makeStyles((theme) => ({
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

export default function StatesInput({
                                        states,
                                        onStatesChange,
                                        initialStateId,
                                        onInitialStateIdChange,
                                        finalStateIds,
                                        onFinalStateIdsChange,
                                        errorState,
                                        helperText,
                                        errorAlertText,
                                        warningAlertText,
                                    }) {
    const classes = useStyles();

    const State = Record({
        id: uuidv4(),
        name: "",
    });

    const handleAddStateClick = () => {
        onStatesChange(prevStates => prevStates.push(State()));
    };

    const handleRemoveStateClick = index => {
        onStatesChange(prevStates => prevStates.delete(index));
    };

    const handleNameChange = (event, index) => {
        const updatedName = event.target.value;
        onStatesChange(prevStates => prevStates.setIn([index, "name"], updatedName));
    };

    const handleInitialStateIdChange = event => {
        const updatedInitialStateId = event.target.value;
        onInitialStateIdChange(updatedInitialStateId);
    };

    const handleFinalStateIdsChange = (event, state) => {
        const isFinal = event.target.checked;
        if (isFinal) {
            onFinalStateIdsChange(prevFinalStateIds => prevFinalStateIds.add(state.get("id")));
        } else {
            onFinalStateIdsChange(prevFinalStateIds => prevFinalStateIds.delete(state.get("id")));
        }
    };

    return (
        <>
            <form className={classes.root} autoComplete="off">
                {states.map((state, index) => (
                    <React.Fragment key={index}>
                        <TextField
                            id={`state-name-${index + 1}`}
                            label={`State ${index + 1} name`}
                            value={state.get("name")}
                            onChange={event => handleNameChange(event, index)}
                            error={errorState.getIn(["stateName", index])}
                            helperText={helperText.getIn(["stateName", index])}
                        />
                        <FormControlLabel
                            control={
                                <Radio
                                    checked={initialStateId === state.get("id")}
                                    value={state.get("id")}
                                    onChange={event => handleInitialStateIdChange(event)}
                                />
                            }
                            label="Initial"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={finalStateIds.includes(state.get("id"))}
                                    onChange={event => handleFinalStateIdsChange(event, state)}
                                    name={`state-${index + 1}-final`}
                                />
                            }
                            label="Final"
                        />
                        <Tooltip title={`Delete State ${index + 1}`}>
                            <IconButton onClick={() => handleRemoveStateClick(index)} aria-label="delete">
                                <DeleteIcon/>
                            </IconButton>
                        </Tooltip>
                    </React.Fragment>
                ))}
                <Button onClick={handleAddStateClick} variant="contained">Add state</Button>
            </form>
            {errorAlertText.isEmpty() || (
                <Alert severity="error">
                    <AlertTitle>{errorAlertText.count() === 1 ? "Error" : "Errors"}</AlertTitle>
                    <ul>
                        {errorAlertText.map((message, index) => (
                            <li key={index}>{message}</li>
                        ))}
                    </ul>
                </Alert>
            )}
            {warningAlertText.isEmpty() || (
                <Alert severity="warning">
                    <AlertTitle>{warningAlertText.count() === 1 ? "Warning" : "Warnings"}</AlertTitle>
                    <ul>
                        {warningAlertText.map((message, index) => (
                            <li key={index}>{message}</li>
                        ))}
                    </ul>
                </Alert>
            )}
        </>
    );
}
