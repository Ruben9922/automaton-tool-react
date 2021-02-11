import React from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Container from "@material-ui/core/Container";
import * as R from 'ramda';
import { v4 as uuidv4 } from "uuid";
import Automaton from "./automaton";
import Input from "./Input";
import View from "./View";
import Home from "./Home";
import Header from "./Header";
import Snackbar from './Snackbar';
import SnackbarMessage from './snackbarMessage';

// TODO: Maybe just remove this and hardcode the messages
const messages: Record<string, string> = {
  automatonAdded: "Automaton created",
  automatonDeleted: "Automaton deleted",
  stateDeleted: "State deleted",
  transitionDeleted: "Transition deleted",
};

export default function App() {
  const [automata, setAutomata] = React.useState<Automaton[]>([]);
  const [snackbarQueue, setSnackbarQueue] = React.useState<SnackbarMessage[]>([]);

  const handleSnackbarOpen = (key: string) => (): void => {
    setSnackbarQueue((prevSnackPack) => R.append({
      id: uuidv4(),
      message: messages[key],
    }, prevSnackPack));
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
            <Input
              addAutomaton={addAutomaton}
              openAutomatonAddedSnackbar={handleSnackbarOpen("automatonAdded")}
              openStateDeletedSnackbar={handleSnackbarOpen("stateDeleted")}
              openTransitionDeletedSnackbar={handleSnackbarOpen("transitionDeleted")}
            />
          </Route>
        </Switch>
        <Snackbar
          snackbarQueue={snackbarQueue}
          setSnackbarQueue={setSnackbarQueue}
        />
      </Container>
    </Router>
  );
}
