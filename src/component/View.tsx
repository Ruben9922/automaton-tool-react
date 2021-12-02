import Checkbox from "@material-ui/core/Checkbox";
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
import {Link, useParams, useRouteMatch} from "react-router-dom";
import Automaton from "../core/automaton";
import TransitionFunctionKey from "../core/transitionFunctionKey";
import Button from "@material-ui/core/Button";

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
  button: {
    margin: theme.spacing(1),
  },
}));

type TransitionsView = "transitions" | "transitionFunction";

type ViewProps = {
  automaton: Automaton;
};

export default function View({ automaton }: ViewProps) {
  const classes = useStyles();

  const { url } = useRouteMatch();

  const [transitionsView, setTransitionsView] = React.useState<TransitionsView>("transitions");

  const symbols = R.prepend(null, automaton.alphabet);

  // Processing parameters
  // const parsedParams = { id: parseInt(params.id, 10) };
  // const errors: Record<string, Check<boolean>> = {
  //   // isIdValidInteger: {
  //   //   isValid: !Number.isNaN(parsedParams.id),
  //   //   message: "Automaton ID must be a valid integer",
  //   // },
  //   isIdValidIndex: {
  //     isValid: automataRef.child(params.id).exis,
  //     message: "Automaton ID does not refer to a valid automaton",
  //   },
  // };
  // const valid = allValid(errors);
  // const alertText = createHelperTextMultiple(R.values(errors));

  // TODO: Edit button in Actions section

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Automaton
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {automaton.name}
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
      <TableContainer component={Paper}>
        <Table aria-label="states" size="small">
          <TableHead>
            <TableRow>
              <TableCell>State</TableCell>
              <TableCell>Initial</TableCell>
              <TableCell>Final</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {automaton.states.map((state) => (
              <TableRow key={state}>
                <TableCell>
                  {state}
                </TableCell>
                <TableCell>
                  <Checkbox
                    disabled
                    checked={R.equals(state, automaton.initialState)}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    disabled
                    checked={R.includes(state, automaton.finalStates)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="h6" component="h2" gutterBottom>
        Transitions
      </Typography>
      {automaton.transitionFunction.size === 0 ? (
        <p>
          No transitions.
        </p>
      ) : (
        <>
          <FormControl component="fieldset">
            <RadioGroup
              row
              aria-label="transitionsView"
              name="transitionsView"
              value={transitionsView}
              onChange={(event) => setTransitionsView(event.target.value as TransitionsView)}
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
                          {currentState}
                        </TableCell>
                        <TableCell>{symbol ?? "ε"}</TableCell>
                        <TableCell>
                          {nextStates.map((nextState) => (
                            <Chip
                              key={nextState}
                              label={nextState}
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
                      {symbols.map((symbol: string | null, index: number) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <TableCell key={index}>{symbol ?? "ε"}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {automaton.states.map((currentState: string) => (
                      <TableRow key={currentState}>
                        <TableCell component="th" scope="row" variant="head">
                          {currentState}
                        </TableCell>
                        {symbols.map((symbol: string | null, index: number) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <TableCell key={index}>
                            {automaton.transitionFunction.get(new TransitionFunctionKey(
                              currentState,
                              symbol,
                            ).toString())?.nextStates.map((nextState) => (
                              <Chip
                                key={nextState}
                                label={nextState}
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
      )}
      <Typography variant="h6" component="h2" gutterBottom>
        Actions
      </Typography>
      <Button component={Link} to={`${url}/run`} variant="contained" className={classes.button}>
        Run
      </Button>
      <Button component={Link} to={`${url}/determinized`} variant="contained" className={classes.button}>
        Determinise
      </Button>
      <Button component={Link} to={`${url}/minimized`} variant="contained" className={classes.button}>
        Minimise
      </Button>
    </>
  );
}
