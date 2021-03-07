import React from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Container from "@material-ui/core/Container";
import * as R from 'ramda';
import { v4 as uuidv4 } from "uuid";
import { useObject } from 'react-firebase-hooks/database';
import Alert from '@material-ui/lab/Alert';
import Link from '@material-ui/core/Link';
import firebase from '../firebase';
import Input from "./Input";
import View from "./View";
import Home from "./Home";
import Header from "./Header";
import Snackbar from './Snackbar';
import SnackbarMessage from '../core/snackbarMessage';
import Loader from './Loader';
import Automata from "./Automata";

// TODO: Maybe just remove this and hardcode the messages
const messages: Record<string, string> = {
  automatonAddedSuccess: "Automaton created",
  automatonAddedFailed: "Failed to create automaton",
  automatonDeleted: "Automaton deleted",
  automatonUpdatedSuccess: "Automaton updated",
  automatonUpdatedFailed: "Failed to update automaton",
  stateDeleted: "State deleted",
  transitionDeleted: "Transition deleted",
};

export default function App() {
  const [automata, loading, error] = useObject(firebase.database().ref("automata").orderByChild("timeAdded"));
  const [snackbarQueue, setSnackbarQueue] = React.useState<SnackbarMessage[]>([]);

  const handleSnackbarOpen = (key: string) => (): void => {
    setSnackbarQueue((prevSnackPack) => R.append({
      id: uuidv4(),
      message: messages[key],
    }, prevSnackPack));
  };

  // const addAutomaton = (automaton: Automaton): void => (
  //   setAutomata((prevAutomata) => R.append(automaton, prevAutomata))
  // );

  return (
    <Router>
      <Header />
      <Container maxWidth="md">
        {error && (
          <Alert severity="error">
            Error: Failed to load data. Try reloading the page. If it persists, please <Link href="https://github.com/Ruben9922/automaton-tool-react/issues">create a new issue</Link>.
            Error code: {error.code}.
          </Alert>
        )}
        {loading && <Loader />}
        {!loading && automata && (
          <Switch>
            <Route exact path="/">
              <Home
                automata={automata}
                // onAutomataChange={setAutomata}
                openSnackbar={handleSnackbarOpen("automatonDeleted")}
              />
            </Route>
            <Route path="/automata">
              <Automata
                automata={automata}
                onSnackbarOpen={handleSnackbarOpen}
              />
            </Route>
          </Switch>
        )}
        <Snackbar
          snackbarQueue={snackbarQueue}
          setSnackbarQueue={setSnackbarQueue}
        />
      </Container>
    </Router>
  );
}
