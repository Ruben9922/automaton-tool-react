import React from "react";
import {fromJS, Set} from "immutable";
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

export default function AlphabetInput({alphabet, onAlphabetChange}) {
    const classes = useStyles();

    const [alphabetPresetIndex, setAlphabetPresetIndex] = React.useState("");

    const handleAlphabetPresetChange = event => {
        const updatedAlphabetPresetIndex = event.target.value;

        setAlphabetPresetIndex(updatedAlphabetPresetIndex);
        onAlphabetChange(alphabetPresets.get(updatedAlphabetPresetIndex).get("symbolsString"));
    };

    const handleAlphabetChange = event => {
        const updatedAlphabet = event.target.value;

        onAlphabetChange(updatedAlphabet);

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
            <TextField id="alphabet" label="Alphabet" value={alphabet} onChange={handleAlphabetChange}/>
        </form>
    );
}
