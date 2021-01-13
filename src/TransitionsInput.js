import React from "react";
import {Record, Set} from "immutable";
import {makeStyles, useTheme} from "@material-ui/core/styles";
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
import {FormHelperText} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import clsx from "clsx";

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
}));

const getStyles = (stateId, transition, theme) => ({
    fontWeight:
        transition.get("nextStates").includes(stateId)
            ? theme.typography.fontWeightMedium
            : theme.typography.fontWeightRegular,
});

export default function TransitionsInput({
                                             transitions,
                                             onTransitionsChange,
                                             alphabet,
                                             states,
                                             errorState,
                                             helperText,
                                             warningAlertText,
                                         }) {
    const classes = useStyles();
    const theme = useTheme();

    const Transition = Record({
        currentState: "",
        symbol: "",
        nextStates: Set(),
    });

    const handleAddTransitionClick = () => {
        onTransitionsChange(prevTransitions => prevTransitions.push(Transition()));
    };

    const handleRemoveTransitionClick = index => {
        onTransitionsChange(prevTransitions => prevTransitions.delete(index));
    };

    const handleCurrentStateChange = (event, index) => {
        const updatedCurrentState = event.target.value;
        onTransitionsChange(prevTransitions => prevTransitions.setIn([index, "currentState"], updatedCurrentState));
    };

    const handleSymbolChange = (event, index) => {
        const updatedSymbol = event.target.value;
        onTransitionsChange(prevTransitions => prevTransitions.setIn([index, "symbol"], updatedSymbol));
    };

    const handleNextStatesChange = (event, index) => {
        const updatedNextStates = event.target.value;
        onTransitionsChange(prevTransitions => prevTransitions.setIn([index, "nextStates"], Set(updatedNextStates)));
    };

    const generatePlaceholderStateName = index => `[State ${index + 1}]`;

    return (
        <>
            <form className={classes.root} autoComplete="off">
                {transitions.map((transition, index) => (
                    <React.Fragment key={index}>
                        <FormControl
                            className={classes.formControl}
                            error={errorState.getIn(["currentState", index])}
                            disabled={states.isEmpty()}
                        >
                            <InputLabel id="transition-current-state-label">Current state</InputLabel>
                            <Select
                                labelId="transition-current-state-label"
                                id="transition-current-state"
                                value={transition.get("currentState")}
                                onChange={event => handleCurrentStateChange(event, index)}>
                                {states.map((state, index) =>
                                    <MenuItem
                                        key={index}
                                        value={state.get("id")}
                                        className={clsx({[classes.placeholderStateName]: state.get("name") === ""})}
                                    >
                                        {state.get("name") === "" ? generatePlaceholderStateName(index) : state.get("name")}
                                    </MenuItem>
                                )}
                            </Select>
                            <FormHelperText>{helperText.getIn(["currentState", index])}</FormHelperText>
                        </FormControl>
                        <FormControl
                            className={classes.formControl}
                            error={errorState.getIn(["symbol", index])}
                            disabled={alphabet.isEmpty()}
                        >
                            <InputLabel id="transition-symbol-label">Symbol</InputLabel>
                            <Select
                                labelId="transition-symbol-label"
                                id="transition-symbol"
                                value={transition.get("symbol")}
                                onChange={event => handleSymbolChange(event, index)}>
                                {alphabet.map((symbol, index) =>
                                    <MenuItem key={index} value={symbol}>{symbol}</MenuItem>
                                )}
                            </Select>
                            <FormHelperText>{helperText.getIn(["symbol", index])}</FormHelperText>
                        </FormControl>
                        <FormControl
                            className={classes.formControl}
                            error={errorState.getIn(["nextStates", index])}
                            disabled={states.isEmpty()}
                        >
                            <InputLabel id="transition-next-states-label">Next states</InputLabel>
                            <Select
                                labelId="transition-next-states-label"
                                id="transition-next-states-label"
                                multiple
                                value={transition.get("nextStates").sort().toArray()}
                                onChange={event => handleNextStatesChange(event, index)}
                                input={<Input id="transition-next-states-select"/>}
                                renderValue={nextStateIds => (
                                    <div className={classes.chips}>
                                        {nextStateIds.map((nextStateId, index) => (
                                            <Chip
                                                key={index}
                                                label={states.some(state => state.get("id") === nextStateId)
                                                    ? states.find(state => state.get("id") === nextStateId).get("name")
                                                    : "[Invalid]"}
                                                className={classes.chip}
                                            />
                                        ))}
                                    </div>
                                )}
                            >
                                {states.map((state, index) => (
                                    <MenuItem
                                        key={index}
                                        value={state.get("id")}
                                        style={getStyles(state.get("id"), transition, theme)}
                                    >
                                        {state.get("name")}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>{helperText.getIn(["nextStates", index])}</FormHelperText>
                        </FormControl>
                        <Tooltip title={`Delete Transition ${index + 1}`}>
                            <IconButton onClick={() => handleRemoveTransitionClick(index)} aria-label="delete">
                                <DeleteIcon/>
                            </IconButton>
                        </Tooltip>
                    </React.Fragment>
                ))}
                <Button onClick={handleAddTransitionClick} variant="contained">Add transition</Button>
            </form>
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
