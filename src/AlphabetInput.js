import React from "react";
import {fromJS, OrderedSet, Set, Map} from "immutable";
import Container from "@material-ui/core/Container";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import {makeStyles} from "@material-ui/core/styles";

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

export default function AlphabetInput({alphabet, onAlphabetChange, alphabetPresetIndex, onAlphabetPresetIndexChange}) {
    const classes = useStyles();
    
    const handleAlphabetPresetChange = event => {
        const updatedAlphabetPresetIndex = event.target.value;

        onAlphabetPresetIndexChange(updatedAlphabetPresetIndex);
        onAlphabetChange(alphabetPresets.get(updatedAlphabetPresetIndex).get("alphabet"));
    };

    const alphabetToAlphabetString = alphabet => alphabet.join("");
    const alphabetStringToAlphabet = alphabetString => OrderedSet(alphabetString.split(""));

    const errors = Map({
        isNonEmpty: !alphabet.isEmpty(),
    });

    const errorMessages = Map({
        isNonEmpty: "Alphabet cannot be empty",
    });

    const errorState = Map({
        alphabet: !errors.get("isNonEmpty"),
    });

    const helperText = Map({
        alphabet: errors.get("isNonEmpty") || errorMessages.get("isNonEmpty"),
    });

    const handleAlphabetChange = event => {
        const updatedAlphabetString = event.target.value;
        const updatedAlphabet = alphabetStringToAlphabet(updatedAlphabetString);

        onAlphabetChange(updatedAlphabet);

        // Check if the entered alphabet matches the alphabet of a preset
        // If so, select this preset
        // (Ignoring order, hence converting both to Sets)
        let updatedAlphabetPresetIndex = alphabetPresets.findIndex((ap) => Set(ap.get("alphabet")).equals(Set(updatedAlphabet)));
        if (updatedAlphabetPresetIndex === -1) {
            updatedAlphabetPresetIndex = 5;
        }
        onAlphabetPresetIndexChange(updatedAlphabetPresetIndex);
    };

    const alphabetPresets = fromJS([
        {
            name: "Binary digits (0-1)",
            alphabet: alphabetStringToAlphabet("01"),
        },
        {
            name: "Decimal digits (0-9)",
            alphabet: alphabetStringToAlphabet("0123456789"),
        },
        {
            name: "Upper-case letters (A-Z)",
            alphabet: alphabetStringToAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
        },
        {
            name: "Lower-case letters (a-z)",
            alphabet: alphabetStringToAlphabet("abcdefghijklmnopqrstuvwxyz"),
        },
        {
            name: "Upper- & lower-case letters (A-Z, a-z)",
            alphabet: alphabetStringToAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"),
        },
        {
            name: "Custom",
            alphabet: alphabetStringToAlphabet(""),
        },
    ]);

    return (
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
            <TextField
                id="alphabet"
                label="Alphabet"
                value={alphabetToAlphabetString(alphabet)}
                onChange={handleAlphabetChange}
                error={errorState.get("alphabet")}
                helperText={helperText.get("alphabet")}
            />
        </form>
    );
}
