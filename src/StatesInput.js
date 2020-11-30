import React from "react";
import {List, OrderedSet} from "immutable";
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
        <form className={classes.root} autoComplete="off">
            {states.map((state, index) => (
                <React.Fragment key={index}>
                    <TextField
                        id={`state-name-${index + 1}`}
                        label={`State ${index + 1} name`}
                        value={state}
                        onChange={event => handleStateNameChange(event, index)}
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
    );
}
