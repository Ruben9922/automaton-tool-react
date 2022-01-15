import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import Home from "./Home";
import AutomatonComponent from "./AutomatonComponent";
import Input from "./Input";
import firebase from "../firebase";

type AutomataProps = {
  automata: any;
  onSnackbarOpen: (key: string) => void;
  user: firebase.User;
};

export default function Automata({
  automata,
  onSnackbarOpen,
  user,
}: AutomataProps) {
  const { url } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={url}>
        <Home
          automata={automata}
          // onAutomataChange={setAutomata}
          openSnackbar={() => onSnackbarOpen("automatonDeleted")}
          user={user}
        />
      </Route>
      <Route path={`${url}/new`}>
        <Input
          automaton={null}
          automatonIndex={automata.numChildren()}
          automatonId={null}
          // addAutomaton={addAutomaton}
          onSnackbarOpen={onSnackbarOpen}
          openStateDeletedSnackbar={() => onSnackbarOpen("stateDeleted")}
          openTransitionDeletedSnackbar={() => onSnackbarOpen("transitionDeleted")}
          user={user}
        />
      </Route>
      <Route path={`${url}/:automatonId`}>
        <AutomatonComponent
          automata={automata}
          onSnackbarOpen={onSnackbarOpen}
          user={user}
        />
      </Route>
    </Switch>
  );
}
