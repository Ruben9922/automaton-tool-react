import React from 'react';
import {Link} from "react-router-dom";
import Container from "@material-ui/core/Container";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import {makeStyles} from "@material-ui/core/styles";
import {fromJS, List, Map, OrderedSet, Set} from "immutable";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Radio from "@material-ui/core/Radio";

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

export default function Home() {
    const classes = useStyles();

    const [automata, setAutomata] = React.useState([]);
    const [alphabetPresetIndex, setAlphabetPresetIndex] = React.useState("");
    const [alphabet, setAlphabet] = React.useState("");
    const [states, setStates] = React.useState(List());
    const [transitions, setTransitions] = React.useState(List());
    const [initialStateIndex, setInitialStateIndex] = React.useState(-1);
    const [finalStateIndices, setFinalStateIndices] = React.useState(OrderedSet());

    const handleAlphabetPresetChange = event => {
        const updatedAlphabetPresetIndex = event.target.value;

        setAlphabetPresetIndex(updatedAlphabetPresetIndex);
        setAlphabet(alphabetPresets.get(updatedAlphabetPresetIndex).get("symbolsString"));
    };

    const handleAlphabetChange = event => {
        const updatedAlphabet = event.target.value;

        setAlphabet(updatedAlphabet);

        // Check if the entered alphabet matches the alphabet of a preset
        // If so, select this preset
        // (Ignoring order, hence sorting both values)
        let updatedAlphabetPresetIndex = alphabetPresets.findIndex((ap) => Set(ap.get("symbolsString").split("")).equals(Set(updatedAlphabet.split(""))));
        if (updatedAlphabetPresetIndex === -1) {
            updatedAlphabetPresetIndex = 5;
        }
        setAlphabetPresetIndex(updatedAlphabetPresetIndex); // Ignore WebStorm warning
    };

    const alphabetPresets = fromJS([
        {
            name: "Binary digits (0-1)",
            symbolsString: "01",
        },
        {
            name: "Decimal digits (0-9)",
            symbolsString: "0123456789",
        },
        {
            name: "Upper-case letters (A-Z)",
            symbolsString: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        },
        {
            name: "Lower-case letters (a-z)",
            symbolsString: "abcdefghijklmnopqrstuvwxyz",
        },
        {
            name: "Upper- & lower-case letters (A-Z, a-z)",
            symbolsString: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        },
        {
            name: "Custom",
            symbolsString: "",
        },
    ]);

    const handleAddStateClick = () => {
        setStates(prevStates => prevStates.push(""));
    };

    const handleRemoveStateClick = index => {
        setStates(prevStates => prevStates.delete(index));
    }

    const handleStateNameChange = (event, index) => {
        const updatedStateName = event.target.value;
        setStates(prevStates => prevStates.set(index, updatedStateName));
    }

    const handleInitialStateChange = (event, index) => {
        setInitialStateIndex(index);
    }

    const handleFinalStateIndicesChange = (event, index) => {
        const isFinal = event.target.checked;
        if (isFinal) {
            setFinalStateIndices(prevFinalStates => prevFinalStates.add(index));
        } else {
            setFinalStateIndices(prevFinalStates => prevFinalStates.delete(index));
        }
    }

    const handleAddTransitionClick = () => {
        setTransitions(prevTransitions => prevTransitions.push(Map({
            currentState: "",
            symbol: "",
            nextState: "",
        })));
    };

    const handleRemoveTransitionClick = index => {
        setTransitions(prevTransitions => prevTransitions.delete(index));
    }

    const handleTransitionChange = (event, index, key) => {
        const updatedTransitionValue = event.target.value;
        setTransitions(prevTransitions => prevTransitions.setIn([index, key], updatedTransitionValue));
    }

    return (
        <Container maxWidth="md">
            <form className={classes.root} autoComplete="off">
                <FormControl className={classes.formControl}>
                    <InputLabel id="alphabet-preset-label">Alphabet preset</InputLabel>
                    <Select
                        labelId="alphabet-preset-label"
                        id="alphabet-preset"
                        value={alphabetPresetIndex}
                        onChange={handleAlphabetPresetChange}>
                        {alphabetPresets.map((alphabetPreset1, index) =>
                            <MenuItem key={index} value={index}>{alphabetPreset1.get("name")}</MenuItem>
                        )}
                    </Select>
                </FormControl>
                <TextField id="alphabet" label="Alphabet" value={alphabet} onChange={handleAlphabetChange}/>

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
                                {alphabet.split("").map((symbol, index) =>
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
        </Container>
    );
}
