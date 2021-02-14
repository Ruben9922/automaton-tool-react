import Chip from "@material-ui/core/Chip";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Paper from "@material-ui/core/Paper";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
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
import State from "./state";
import TransitionFunctionKey from "./transitionFunctionKey";
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

type TransitionView = "transitions" | "transitionFunction";

type ViewParams = {
  id: string;
};

type ViewProps = {
  automata: Automaton[];
};

export default function View({ automata }: ViewProps) {
  const classes = useStyles();

  const [transitionsView, setTransitionsView] = React.useState<TransitionView>("transitions");

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
      <FormControl component="fieldset">
        <RadioGroup
          row
          aria-label="transitionsView"
          name="transitionsView"
          value={transitionsView}
          onChange={(event) => setTransitionsView(event.target.value as TransitionView)}
        >
          <FormControlLabel
            value="transitions"
            control={<Radio />}
            label="Transitions view"
          />
          <FormControlLabel
            value="transitionFunction"
            control={<Radio />}
            label="Transition function view"
          />
        </RadioGroup>
      </FormControl>
      {transitionsView !== "transitionFunction" ? (
        <TableContainer component={Paper}>
          <Table aria-label="transitions" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Current state</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Next states</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from(automaton.transitionFunction.values())
                .map(({ currentState, symbol, nextStates }, transitionIndex) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <TableRow key={transitionIndex}>
                    <TableCell>
                      {currentState.name}
                    </TableCell>
                    <TableCell>{symbol}</TableCell>
                    <TableCell>
                      {nextStates.map((state) => (
                        <Chip
                          key={state.id}
                          label={state.name}
                          className={classes.chip}
                        />
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table aria-label="transition function" size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  {automaton.alphabet.map((symbol: string, index: number) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <TableCell key={index}>{symbol}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {automaton.states.map((currentState: State) => (
                  <TableRow key={currentState.id}>
                    <TableCell component="th" scope="row" variant="head">
                      {currentState.name}
                    </TableCell>
                    {automaton.alphabet.map((symbol: string, index: number) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <TableCell key={index}>
                        {automaton.transitionFunction.get(new TransitionFunctionKey(
                          currentState.id,
                          symbol,
                        ).toString())?.nextStates.map((nextState) => (
                          <Chip
                            key={nextState.id}
                            label={nextState.name}
                            className={classes.chip}
                          />
                        ))}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <p>
            The rows correspond to the current state; the columns correspond to the symbol. Each
            cell contains the next states for the given current state and symbol.
          </p>
        </>
      )}
    </>
  ) : (
    <Alert severity="error">
      {alertText}
    </Alert>
  );
}
