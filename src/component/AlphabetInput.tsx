import React from "react";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { AlphabetErrorState, AlphabetHelperText } from "../core/validation";
import { alphabetPresets } from "../core/alphabetPreset";

const useStyles = makeStyles((theme: Theme) => ({
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

type AlphabetInputProps = {
  alphabet: string[];
  alphabetPresetIndex: number | "";
  errorState: AlphabetErrorState;
  helperText: AlphabetHelperText;
  onSetAlphabetPresetIndex: (index: number | "") => void;
  onSetAlphabet: (alphabetString: string) => void;
};

export default function AlphabetInput({
  alphabet,
  alphabetPresetIndex,
  errorState,
  helperText,
  onSetAlphabetPresetIndex,
  onSetAlphabet,
}: AlphabetInputProps) {
  const classes = useStyles();

  // TODO: Use alphabet preset ID instead of index
  return (
    <form className={classes.root} autoComplete="off">
      <FormControl className={classes.formControl}>
        <InputLabel id="alphabet-preset-label">Alphabet preset</InputLabel>
        <Select
          labelId="alphabet-preset-label"
          id="alphabet-preset"
          value={alphabetPresetIndex}
          onChange={(event) => onSetAlphabetPresetIndex(event.target.value as number | "")}
        >
          {alphabetPresets.map((alphabetPreset, index) => (
            <MenuItem key={alphabetPreset.id} value={index}>{alphabetPreset.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        id="alphabet"
        label="Alphabet"
        value={alphabet.join("")}
        onChange={(event) => onSetAlphabet(event.target.value)}
        error={errorState.alphabet}
        helperText={helperText.alphabet}
      />
    </form>
  );
}
