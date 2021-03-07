import {
  Route, Switch, useParams, useRouteMatch,
} from "react-router-dom";
import Alert from "@material-ui/lab/Alert";
import React from "react";
import Automaton from "../core/automaton";
import View from "./View";
import Input from "./Input";
import * as R from "ramda";

type AutomatonParams = {
  automatonId: string;
};

type AutomatonProps = {
  automata: any;
  onSnackbarOpen: (key: string) => () => void;
};

export default function AutomatonComponent({
  automata,
  onSnackbarOpen,
}: AutomatonProps) {
  const { url } = useRouteMatch();
  const { automatonId } = useParams<AutomatonParams>();

  if (!automata.hasChild(automatonId)) {
    return (
      <Alert severity="error">
        Automaton not found.
      </Alert>
    );
  }

  const value = automata.child(automatonId).val();
  const automaton = Automaton.fromDb(value);
  const automatonIndex = R.indexOf(automatonId, R.keys(automata.val()));

  return (
    <Switch>
      <Route exact path={url}>
        <View automaton={automaton} />
      </Route>
      <Route path={`${url}/edit`}>
        <Input
          automaton={automaton}
          automatonIndex={automatonIndex}
          automatonId={automatonId}
          // addAutomaton={addAutomaton}
          onSnackbarOpen={onSnackbarOpen}
          openStateDeletedSnackbar={onSnackbarOpen("stateDeleted")}
          openTransitionDeletedSnackbar={onSnackbarOpen("transitionDeleted")}
        />
      </Route>
    </Switch>
  );
}
