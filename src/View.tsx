import Chip from "@material-ui/core/Chip";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import Alert from "@material-ui/lab/Alert";
import * as R from "ramda";
import React from "react";
import { useParams } from "react-router-dom";
import Automaton from "./automaton";
import { allValid, Check, createHelperTextMultiple } from "./validation";

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    listStyle: 'none',
    padding: theme.spacing(0.5),
    margin: 0,
    // width: "50%",
  },
  chip: {
    margin: theme.spacing(0.5),
  },
}));

type ViewParams = {
  id: string;
};

type ViewProps = {
  automata: Automaton[];
};

export default function View({ automata }: ViewProps) {
  const classes = useStyles();

  // Processing parameters
  const params = useParams<ViewParams>();
  const parsedParams = { id: parseInt(params.id, 10) };
  const errors: Record<string, Check<boolean>> = {
    isIdValidInteger: {
      isValid: !Number.isNaN(parsedParams.id),
      message: "Automaton ID must be a valid integer",
    },
    isIdValidIndex: {
      isValid: R.has(parsedParams.id.toString(), automata),
      message: "Automaton ID does not refer to a valid automaton",
    },
  };
  const valid = allValid(errors);
  const alertText = createHelperTextMultiple(R.values(errors));

  const automaton = automata[parsedParams.id];

  return valid ? (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Automaton
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom>
        Alphabet
      </Typography>
      <Paper component="ul" className={classes.root}>
        {automaton.alphabet.map((symbol, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            <Chip
              label={symbol}
              className={classes.chip}
            />
          </li>
        ))}
      </Paper>
      <Typography variant="h6" component="h2" gutterBottom>
        States
      </Typography>
      <Paper component="ul" className={classes.root}>
        {automaton.states.map((state) => (
          <li key={state.id}>
            <Chip
              label={state.name}
              className={classes.chip}
            />
          </li>
        ))}
      </Paper>
      <Typography variant="h6" component="h2" gutterBottom>
        Transitions
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="simple table" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Current state</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Next states</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(automaton.transitionFunction,
              ([{ currentState, symbol }, nextStates], transitionIndex) => (
                <TableRow key={transitionIndex}>
                  <TableCell>
                    {currentState.name}
                  </TableCell>
                  <TableCell>{symbol}</TableCell>
                  <TableCell>
                    {/* <Paper component="ul" className={classes.root}> */}
                    {nextStates.map((state) => (
                      // <li >
                      <Chip
                        key={state.id}
                        label={state.name}
                        className={classes.chip}
                      />
                      // </li>
                    ))}
                    {/* </Paper> */}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  ) : (
    <Alert severity="error">
      {alertText}
    </Alert>
  );
}
