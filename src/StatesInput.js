import React from "react";
import {List, OrderedSet, Map,is} from "immutable";
import Container from "@material-ui/core/Container";
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

export default function StatesInput({states, onStatesChange, initialStateIndex, onInitialStateIndexChange, finalStateIndices, onFinalStateIndicesChange}) {
    const classes = useStyles();

    const errors = Map({
        isNonEmpty: !states.isEmpty(),
        areStateNamesNonEmpty: states.map(name => !!name),
        areStateNamesUnique: states.map(state1 => states.count(state2 => state1 === state2) === 1),
        exactlyOneInitialState: initialStateIndex >= 0 && initialStateIndex < states.count(),
    });

    const errorMessages = Map({
        isNonEmpty: "At least one state is required",
        areStateNamesNonEmpty: "State name cannot be left blank",
        areStateNamesUnique: "State name must be unique",
        exactlyOneInitialState: "A state must be selected as the initial state"
    })

    const errorState = Map({
        stateName: errors.get("areStateNamesNonEmpty")
            .zipWith((x, y) => x && y, errors.get("areStateNamesUnique"))
            .map(x => !x),
    });

    const helperText = Map({
        stateName: errors.get("areStateNamesNonEmpty").map(x => x || errorMessages.get("areStateNamesNonEmpty"))
            .zipWith((x, y) => x === true ? y : x,
                errors.get("areStateNamesUnique").map(y => y || errorMessages.get("areStateNamesUnique"))
            ),
    });

    const alertText = List([
        errors.get("isNonEmpty") || errorMessages.get("isNonEmpty"),
        errors.get("exactlyOneInitialState") || errorMessages.get("exactlyOneInitialState"),
    ]).filter(x => x !== true);

    const handleAddStateClick = () => {
        onStatesChange(prevStates => prevStates.push(""));
    };

    const handleRemoveStateClick = index => {
        onStatesChange(prevStates => prevStates.delete(index));
    }

    const handleStateNameChange = (event, index) => {
        const updatedStateName = event.target.value;
        onStatesChange(prevStates => prevStates.set(index, updatedStateName));
    }

    const handleInitialStateChange = (event, index) => {
        onInitialStateIndexChange(index);
    }

    const handleFinalStateIndicesChange = (event, index) => {
        const isFinal = event.target.checked;
        if (isFinal) {
            onFinalStateIndicesChange(prevFinalStates => prevFinalStates.add(index));
        } else {
            onFinalStateIndicesChange(prevFinalStates => prevFinalStates.delete(index));
        }
    }

    return (
        <>
            <form className={classes.root} autoComplete="off">
                {states.map((state, index) => (
                    <React.Fragment key={index}>
                        <TextField
                            id={`state-name-${index + 1}`}
                            label={`State ${index + 1} name`}
                            value={state}
                            onChange={event => handleStateNameChange(event, index)}
                            error={errorState.getIn(["stateName", index])}
                            helperText={helperText.getIn(["stateName", index])}
                        />
                        <FormControlLabel
                            control={
                                <Radio
                                    checked={initialStateIndex === index}
                                    onChange={event => handleInitialStateChange(event, index)}
                                />
                            }
                            label="Initial"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={finalStateIndices.includes(index)}
                                    onChange={event => handleFinalStateIndicesChange(event, index)}
                                    name={`state-${index + 1}-final`}
                                />
                            }
                            label="Final"
                        />
                        <Tooltip title={`Delete state ${index + 1}`}>
                            <IconButton onClick={() => handleRemoveStateClick(index)} aria-label="delete">
                                <DeleteIcon/>
                            </IconButton>
                        </Tooltip>
                    </React.Fragment>
                ))}
                <Button onClick={handleAddStateClick} variant="contained">Add state</Button>
            </form>
            {alertText.isEmpty() || (
                <Alert severity="error">
                    <AlertTitle>Error</AlertTitle>
                    <ul>
                        {alertText.map((message, index) => (
                            <li key={index}>{message}</li>
                        ))}
                    </ul>
                </Alert>
            )}
        </>
    );
}
