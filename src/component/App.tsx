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
import PrivateRoute from "./PrivateRoute";
import {useAuthState} from "react-firebase-hooks/auth";
import PublicRoute from "./PublicRoute";
import SignUp from "./SignUp";
import Login from "./Login";

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
  const [automata, databaseLoading, databaseError] = useObject(firebase.database().ref("automata").orderByChild("timeAdded"));
  const [user, authLoading, authError] = useAuthState(firebase.auth());
  const [snackbarQueue, setSnackbarQueue] = React.useState<SnackbarMessage[]>([]);

  const authenticated = user !== null && user !== undefined;

  const handleSnackbarOpen = (key: string): void => {
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
      <Header authenticated={authenticated} />
      <Container maxWidth="md">
        {databaseError && (
          <Alert severity="error">
            Error: Failed to load data. Try reloading the page. If it persists, please <Link href="https://github.com/Ruben9922/automaton-tool-react/issues">create a new issue</Link>.
            Error code: {databaseError.code}.
          </Alert>
        )}
        {authError && (
          <Alert severity="error">
            Error: Failed to authenticate. Try reloading the page. If it persists, please <Link href="https://github.com/Ruben9922/automaton-tool-react/issues">create a new issue</Link>.
            Error code: {authError.code}.
          </Alert>
        )}
        {(databaseLoading || authLoading) && <Loader />}
        {!databaseLoading && !authLoading && automata && (
          <Switch>
            <PrivateRoute authenticated={authenticated} exact path="/">
              <Home
                automata={automata}
                // onAutomataChange={setAutomata}
                openSnackbar={() => handleSnackbarOpen("automatonDeleted")}
              />
            </PrivateRoute>
            <PrivateRoute authenticated={authenticated} path="/automata">
              <Automata
                automata={automata}
                onSnackbarOpen={handleSnackbarOpen}
              />
            </PrivateRoute>
            <PublicRoute authenticated={authenticated} path="/sign-up">
              <SignUp />
            </PublicRoute>
            <PublicRoute authenticated={authenticated} path="/login">
              <Login />
            </PublicRoute>
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
