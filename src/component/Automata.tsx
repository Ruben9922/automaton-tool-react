import React from "react";
import {Route, Switch, useRouteMatch} from "react-router-dom";
import Home from "./Home";
import AutomatonComponent from "./AutomatonComponent";
import Input from "./Input";

type AutomataProps = {
  automata: any;
  onSnackbarOpen: (key: string) => () => void;
};

export default function Automata({
  automata,
  onSnackbarOpen,
}: AutomataProps) {
  const { url } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={url}>
        <Home
          automata={automata}
          // onAutomataChange={setAutomata}
          openSnackbar={onSnackbarOpen("automatonDeleted")}
        />
      </Route>
      <Route path={`${url}/new`}>
        <Input
          automaton={null}
          automatonIndex={automata.numChildren()}
          automatonId={null}
          // addAutomaton={addAutomaton}
          onSnackbarOpen={onSnackbarOpen}
          openStateDeletedSnackbar={onSnackbarOpen("stateDeleted")}
          openTransitionDeletedSnackbar={onSnackbarOpen("transitionDeleted")}
        />
      </Route>
      <Route path={`${url}/:automatonId`}>
        <AutomatonComponent
          automata={automata}
          onSnackbarOpen={onSnackbarOpen}
        />
      </Route>
    </Switch>
  );
}
