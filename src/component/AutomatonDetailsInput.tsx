import React from 'react';
import { makeStyles, Theme } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";

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

type AutomatonDetailsInputProps = {
  name: string;
  placeholderName: string;
  onNameChange: (name: string) => void;
};

export default function AutomatonDetailsInput({
  name,
  placeholderName,
  onNameChange,
}: AutomatonDetailsInputProps) {
  const classes = useStyles();

  return (
    <form className={classes.root} onSubmit={(event) => event.preventDefault()}>
      <TextField
        id="name"
        label="Automaton name"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        helperText={(
          <span>
            Leave blank for <i>{placeholderName}</i>
          </span>
        )}
      />
    </form>
  );
}
