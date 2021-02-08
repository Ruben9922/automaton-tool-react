import React from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Container from "@material-ui/core/Container";
import Snackbar from "@material-ui/core/Snackbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles, Theme } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import * as R from 'ramda';
import { v4 as uuidv4 } from "uuid";
import Automaton from "./automaton";
import Input from "./Input";
import View from "./View";
import Home from "./Home";
import Header from "./Header";

const useStyles = makeStyles((theme: Theme) => ({
  close: {
    padding: theme.spacing(0.5),
  },
}));

interface SnackbarMessage {
  id: string | null;
  message: string;
}

const messages: Record<string, string> = {
  automatonAdded: "Automaton created",
  automatonDeleted: "Automaton deleted",
  stateDeleted: "State deleted",
};

export default function App() {
  const classes = useStyles();

  const [automata, setAutomata] = React.useState<Automaton[]>([]);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<SnackbarMessage | null>(null);

  const handleSnackbarOpen = (key: string) => (): void => {
    setSnackbar({
      id: uuidv4(),
      message: messages[key],
    });
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event: object | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    reason?: string): void => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarOpen(false);
  };

  const handleSnackbarExited = (): void => {
    setSnackbar(null);
  };

  const addAutomaton = (automaton: Automaton): void => (
    setAutomata((prevAutomata) => R.append(automaton, prevAutomata))
  );

  return (
    <Router>
      <Header />
      <Container maxWidth="md">
        <Switch>
          <Route exact path="/">
            <Home
              automata={automata}
              onAutomataChange={setAutomata}
              openSnackbar={handleSnackbarOpen("automatonDeleted")}
            />
          </Route>
          <Route path="/view">
            <View />
          </Route>
          <Route path="/create">
            <Input addAutomaton={addAutomaton} openSnackbar={handleSnackbarOpen("automatonAdded")} />
          </Route>
        </Switch>
        <Snackbar
          key={snackbar !== null ? snackbar.id : null}
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          onExited={handleSnackbarExited}
          message={snackbar !== null ? snackbar.message : null}
          action={(
            <>
              <Button color="secondary" size="small" onClick={handleSnackbarClose}>
                UNDO
              </Button>
              <IconButton
                aria-label="close"
                color="inherit"
                className={classes.close}
                onClick={handleSnackbarClose}
              >
                <CloseIcon />
              </IconButton>
            </>
          )}
        />
      </Container>
    </Router>
  );
}
