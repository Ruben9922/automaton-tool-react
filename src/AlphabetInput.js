import React from "react";
import {fromJS, OrderedSet, Set} from "immutable";
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

// TODO: Use List() and Map() methods instead of fromJS
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

function alphabetToAlphabetString(a) {
  return a.join("");
}

function alphabetStringToAlphabet(as) {
  return OrderedSet(as.split(""));
}

function alphabetToAlphabetPresetIndex(a) {
  // Check if the entered alphabet matches the alphabet of a preset
  // If so, select this preset
  // (Ignoring order, hence converting both to Sets)
  // TODO: Maybe use toSet() instead of Set()
  let updatedAlphabetPresetIndex = alphabetPresets.findIndex(alphabetPreset =>
    Set(alphabetPreset.get("alphabet")).equals(Set(a))
  );

  // If it doesn't match a preset, then use the custom preset (whose index is 5)
  if (updatedAlphabetPresetIndex === -1) {
    updatedAlphabetPresetIndex = 5;
  }

  return updatedAlphabetPresetIndex;
}

function alphabetPresetIndexToAlphabet(api) {
  return alphabetPresets.get(api).get("alphabet");
}

export default function AlphabetInput({
                                        alphabet,
                                        onAlphabetChange,
                                        alphabetPresetIndex,
                                        onAlphabetPresetIndexChange,
                                        errorState,
                                        helperText
                                      }) {
  const classes = useStyles();

  const handleAlphabetPresetChange = event => {
    const updatedAlphabetPresetIndex = event.target.value;
    onAlphabetPresetIndexChange(updatedAlphabetPresetIndex);
  };

  const handleAlphabetChange = event => {
    const updatedAlphabetString = event.target.value;
    const updatedAlphabet = alphabetStringToAlphabet(updatedAlphabetString);
    onAlphabetChange(updatedAlphabet);
  };

  const updateAlphabet = () => {
    if (alphabetPresetIndex !== "") {
      onAlphabetChange(a => {
        return alphabetToAlphabetPresetIndex(a) === alphabetPresetIndex ? a : alphabetPresetIndexToAlphabet(alphabetPresetIndex);
      });
    }
  };

  const updateAlphabetPresetIndex = () => {
    const updatedAlphabetPresetIndex = alphabetToAlphabetPresetIndex(alphabet);
    onAlphabetPresetIndexChange(updatedAlphabetPresetIndex);
  };

  React.useEffect(updateAlphabet, [alphabetPresetIndex, onAlphabetChange]);
  React.useEffect(updateAlphabetPresetIndex, [alphabet, onAlphabetPresetIndexChange]);

  return (
    <form className={classes.root} autoComplete="off">
      <FormControl className={classes.formControl}>
        <InputLabel id="alphabet-preset-label">Alphabet preset</InputLabel>
        <Select
          labelId="alphabet-preset-label"
          id="alphabet-preset"
          value={alphabetPresetIndex}
          onChange={handleAlphabetPresetChange}
        >
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
