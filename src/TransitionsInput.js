import React from "react";
import {Set, Map, List} from "immutable";
import {makeStyles, useTheme} from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
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
}));

const getStyles = (state, transition, theme) => ({
    fontWeight:
        transition.get("nextStates").includes(state)
            ? theme.typography.fontWeightMedium
            : theme.typography.fontWeightRegular,
});

export default function TransitionsInput({transitions, onTransitionsChange, alphabet, states}) {
    const classes = useStyles();
    const theme = useTheme();

    // TODO: Use Map on inside and List on outside so can use reduce() instead of zipWith()
    const errors = Map({
        areCurrentStatesNonEmpty: transitions.map(transition => transition.get("currentState") !== ""),
        areCurrentStatesValid: transitions.map(transition =>
            transition.get("currentState") >= 0 && transition.get("currentState") < states.count()
        ),
        areSymbolsNonEmpty: transitions.map(transition => transition.get("symbol") !== ""),
        areSymbolsValid: transitions.map(transition => alphabet.includes(transition.get("symbol"))),
        areNextStatesNonEmpty: transitions.map(transition => !transition.get("nextStates").isEmpty()),
        areNextStatesValid: transitions.map(transition => transition.get("nextStates").every(state =>
            state >= 0 && state < states.count()
        )),
        areTransitionsUnique: transitions.map((transition1, index) => transitions.findIndex(transition2 =>
            transition1.get("currentState") === transition2.get("currentState")
            && transition1.get("symbol") === transition2.get("symbol")
        ) === index),
    });

    const errorMessages = Map({
        areCurrentStatesNonEmpty: "Current state cannot be left blank",
        areCurrentStatesValid: "State does not exist",
        areSymbolsNonEmpty: "Symbol cannot be left blank",
        areSymbolsValid: "Symbol does not exist in alphabet",
        areNextStatesNonEmpty: "Next states cannot be empty",
        areNextStatesValid: "One or more states do not exist",
        areTransitionsUnique: "Transition must be unique",
    });

    const errorState = Map({
        currentState: errors.get("areCurrentStatesNonEmpty")
            .zipWith((x, y) => x && y, errors.get("areCurrentStatesValid"))
            .zipWith((x, y) => x && y, errors.get("areTransitionsUnique"))
            .map(x => !x),
        symbol: errors.get("areSymbolsNonEmpty")
            .zipWith((x, y) => x && y, errors.get("areSymbolsValid"))
            .zipWith((x, y) => x && y, errors.get("areTransitionsUnique"))
            .map(x => !x),
        nextStates: errors.get("areNextStatesNonEmpty")
            .zipWith((x, y) => x && y, errors.get("areNextStatesValid"))
            .map(x => !x),
    });

    const helperText = Map({
        currentState: errors.get("areCurrentStatesNonEmpty").map(x => x || errorMessages.get("areCurrentStatesNonEmpty"))
            .zipWith((x, y) => x === true ? y : x,
                errors.get("areCurrentStatesValid").map(x => x || errorMessages.get("areCurrentStatesValid"))
            )
            .zipWith((x, y) => x === true ? y : x,
                errors.get("areTransitionsUnique").map(x => x || errorMessages.get("areTransitionsUnique"))
            ),
        symbol: errors.get("areSymbolsNonEmpty").map(x => x || errorMessages.get("areSymbolsNonEmpty"))
            .zipWith((x, y) => x === true ? y : x,
                errors.get("areSymbolsValid").map(x => x || errorMessages.get("areSymbolsValid"))
            )
            .zipWith((x, y) => x === true ? y : x,
                errors.get("areTransitionsUnique").map(x => x || errorMessages.get("areTransitionsUnique"))
            ),
        nextStates: errors.get("areNextStatesNonEmpty").map(x => x || errorMessages.get("areNextStatesNonEmpty"))
            .zipWith((x, y) => x === true ? y : x,
                errors.get("areNextStatesValid").map(x => x || errorMessages.get("areNextStatesValid"))
            ),
    });

    const handleAddTransitionClick = () => {
        onTransitionsChange(prevTransitions => prevTransitions.push(Map({
            currentState: "",
            symbol: "",
            nextStates: Set(),
        })));
    };

    const handleRemoveTransitionClick = index => {
        onTransitionsChange(prevTransitions => prevTransitions.delete(index));
    }

    const handleCurrentStateChange = (event, index) => {
        const updatedCurrentState = event.target.value;
        onTransitionsChange(prevTransitions => prevTransitions.setIn([index, "currentState"], updatedCurrentState));
    }

    const handleSymbolChange = (event, index) => {
        const updatedSymbol = event.target.value;
        onTransitionsChange(prevTransitions => prevTransitions.setIn([index, "symbol"], updatedSymbol));
    }

    const handleNextStatesChange = (event, index) => {
        const updatedNextStates = event.target.value;
        onTransitionsChange(prevTransitions => prevTransitions.setIn([index, "nextStates"], Set(updatedNextStates)));
    }

    return (
        <form className={classes.root} autoComplete="off">
            {transitions.map((transition, index) => (
                <React.Fragment key={index}>
                    <FormControl className={classes.formControl} error={errorState.getIn(["currentState", index])}>
                        <InputLabel id="transition-current-state-label">Current state</InputLabel>
                        <Select
                            labelId="transition-current-state-label"
                            id="transition-current-state"
                            value={transition.get("currentState")}
                            onChange={event => handleCurrentStateChange(event, index)}>
                            {states.map((state, index) =>
                                <MenuItem key={index} value={index}>{state}</MenuItem>
                            )}
                        </Select>
                        <FormHelperText>{helperText.getIn(["currentState", index])}</FormHelperText>
                    </FormControl>
                    <FormControl className={classes.formControl} error={errorState.getIn(["symbol", index])}>
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
                    <FormControl className={classes.formControl} error={errorState.getIn(["nextStates", index])}>
                        <InputLabel id="transition-next-states-label">Next states</InputLabel>
                        <Select
                            labelId="transition-next-states-label"
                            id="transition-next-states-label"
                            multiple
                            value={transition.get("nextStates").sort().toArray()}
                            onChange={event => handleNextStatesChange(event, index)}
                            input={<Input id="transition-next-states-select"/>}
                            renderValue={selected => (
                                <div className={classes.chips}>
                                    {selected.map((value, index) => (
                                        <Chip key={index} label={states.get(value)} className={classes.chip}/>
                                    ))}
                                </div>
                            )}
                        >
                            {states.map((state, index) => (
                                <MenuItem key={index} value={index} style={getStyles(state, transition, theme)}>
                                    {state}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>{helperText.getIn(["nextStates", index])}</FormHelperText>
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
