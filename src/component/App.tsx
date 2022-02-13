import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Container from "@material-ui/core/Container";
import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import { useObject } from "react-firebase-hooks/database";
import Alert from "@material-ui/lab/Alert";
import Link from "@material-ui/core/Link";
import { useAuthState } from "react-firebase-hooks/auth";
import firebase from "../firebase";
import Header from "./Header";
import Snackbar from "./Snackbar";
import SnackbarMessage from "../core/snackbarMessage";
import Loader from "./Loader";
import Routes from "./Routes";

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
  const [user, authLoading, authError] = useAuthState(firebase.auth());
  const [automata, databaseLoading, databaseError] = useObject(firebase.database().ref(`/users/${user?.uid}/automata`).orderByChild("timeAdded"));
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
        {authenticated && databaseError && (
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
        {!databaseLoading && !authLoading && (
          <Routes
            automata={automata}
            user={user}
            authenticated={authenticated}
            onSnackbarOpen={handleSnackbarOpen}
          />
        )}
        <Snackbar
          snackbarQueue={snackbarQueue}
          setSnackbarQueue={setSnackbarQueue}
        />
      </Container>
    </Router>
  );
}
