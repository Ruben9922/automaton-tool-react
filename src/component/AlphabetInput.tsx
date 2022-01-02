import React from "react";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import { makeStyles, Theme } from "@material-ui/core/styles";
import * as R from "ramda";
import { AlphabetErrorState, AlphabetHelperText } from "../core/validation";
import { alphabetPresets, customAlphabetPreset } from "../core/alphabetPreset";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
      width: "25ch",
    },
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

type AlphabetInputProps = {
  alphabet: string[];
  errorState: AlphabetErrorState;
  helperText: AlphabetHelperText;
  onSetAlphabet: (alphabet: string[]) => void;
};

function alphabetPresetIdToAlphabet(alphabetPresetId: string): string[] {
  return R.find(
    (alphabetPreset) => alphabetPreset.id === alphabetPresetId,
    alphabetPresets,
  )?.alphabet ?? customAlphabetPreset.alphabet;
}

function alphabetToAlphabetPresetId(alphabet: string[]): string {
  // Check if the entered alphabet matches the alphabet of a preset
  // If so, select this preset
  // (Ignoring order and repeats, hence sorting and removing duplicates)
  const likeSet = R.pipe(R.sortBy(R.identity), R.uniq);
  const alphabetPresetId = R.find(
    (alphabetPreset) => R.equals(likeSet(alphabetPreset.alphabet), likeSet(alphabet)),
    alphabetPresets,
  )?.id ?? customAlphabetPreset.id;

  return alphabetPresetId;
}

export default function AlphabetInput({
  alphabet,
  errorState,
  helperText,
  onSetAlphabet,
}: AlphabetInputProps) {
  const classes = useStyles();

  return (
    <form className={classes.root} autoComplete="off" onSubmit={(event) => event.preventDefault()}>
      <FormControl className={classes.formControl}>
        <InputLabel id="alphabet-preset-label">Alphabet preset</InputLabel>
        <Select
          labelId="alphabet-preset-label"
          id="alphabet-preset"
          value={alphabetToAlphabetPresetId(alphabet)}
          onChange={(event) => (
            onSetAlphabet(alphabetPresetIdToAlphabet(event.target.value as string))
          )}
        >
          {alphabetPresets.map((alphabetPreset) => (
            <MenuItem key={alphabetPreset.id} value={alphabetPreset.id}>
              {alphabetPreset.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        id="alphabet"
        label="Alphabet"
        value={alphabet.join("")}
        onChange={(event) => onSetAlphabet(event.target.value.split(""))}
        error={errorState.alphabet}
        helperText={helperText.alphabet}
      />
    </form>
  );
}
