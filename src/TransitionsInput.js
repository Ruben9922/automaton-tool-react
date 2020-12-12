import React from "react";
import {List, Map} from "immutable";
import {makeStyles} from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
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

export default function TransitionsInput({transitions, onTransitionsChange, alphabet, states}) {
    const classes = useStyles();

    const handleAddTransitionClick = () => {
        onTransitionsChange(prevTransitions => prevTransitions.push(Map({
            currentState: "",
            symbol: "",
            nextState: "",
        })));
    };

    const handleRemoveTransitionClick = index => {
        onTransitionsChange(prevTransitions => prevTransitions.delete(index));
    }

    const handleTransitionChange = (event, index, key) => {
        const updatedTransitionValue = event.target.value;
        onTransitionsChange(prevTransitions => prevTransitions.setIn([index, key], updatedTransitionValue));
    }

    return (
        <form className={classes.root} autoComplete="off">
            {transitions.map((transition, index) => (
                <React.Fragment key={index}>
                    <FormControl className={classes.formControl}>
                        <InputLabel id="transition-current-state-label">Current state</InputLabel>
                        <Select
                            labelId="transition-current-state-label"
                            id="transition-current-state"
                            value={transition.get("currentState")}
                            onChange={event => handleTransitionChange(event, index, "currentState")}>
                            {states.map((state, index) =>
                                <MenuItem key={index} value={index}>{state}</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <FormControl className={classes.formControl}>
                        <InputLabel id="transition-symbol-label">Symbol</InputLabel>
                        <Select
                            labelId="transition-symbol-label"
                            id="transition-symbol"
                            value={transition.get("symbol")}
                            onChange={event => handleTransitionChange(event, index, "symbol")}>
                            {alphabet.map((symbol, index) =>
                                <MenuItem key={index} value={symbol}>{symbol}</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <FormControl className={classes.formControl}>
                        <InputLabel id="transition-next-state-label">Next state</InputLabel>
                        <Select
                            labelId="transition-next-state-label"
                            id="transition-next-state"
                            value={transition.get("nextState")}
                            onChange={event => handleTransitionChange(event, index, "nextState")}>
                            {states.map((state, index) =>
                                <MenuItem key={index} value={index}>{state}</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <Tooltip title={`Delete transition ${index + 1}`}>
                        <IconButton onClick={() => handleRemoveTransitionClick(index)} aria-label="delete">
                            <DeleteIcon/>
                        </IconButton>
                    </Tooltip>
                </React.Fragment>
            ))}
            <Button onClick={handleAddTransitionClick} variant="contained">Add transition</Button>
        </form>
    );
}
