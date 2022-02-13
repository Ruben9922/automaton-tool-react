import React from "react";
import {
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
} from "react-router-dom";
import * as R from "ramda";
import Alert from "@material-ui/lab/Alert";
import Home from "./Home";
import Input from "./Input";
import Login from "./Login";
import RunComponent from "./RunComponent";
import View from "./View";
import Automaton, { dbToAutomaton, determinize, minimize } from "../core/automaton";
import firebase from "../firebase";

type RoutesProps = {
  automata: any;
  user: firebase.User;
  authenticated: boolean;
  onSnackbarOpen: (key: string) => void;
};

type AutomatonParams = {
  automatonId: string;
};

type RouteRenderFunction =
  | (() => React.ReactNode)
  | ((routeProps: RouteComponentProps<AutomatonParams>) => React.ReactNode);

interface RouteData {
  path: string;
  render: RouteRenderFunction;
  isPrivate: boolean;
  routes?: RouteData[];
}

function flattenRoutes(routes: RouteData[]): RouteData[] {
  return R.flatten(
    R.map((route) => [(route.routes ? flattenRoutes(route.routes) : []), route], routes),
  );
}

function combinePaths(parentPath: string, childPath: string): string {
  // Concatenate paths, with a slash between them
  // Remove slash at the end of the parent path and at the start of the child path to prevent
  // multiple slashes being inserted between them
  return `${parentPath.replace(/\/$/, "")}/${childPath.replace(/^\//, "")}`;
}

interface AutomatonComponentProps {
  automaton: Automaton;
  automatonIndex: number;
  automatonId: string;
}

function buildPaths(routes: RouteData[], parentPath = ""): RouteData[] {
  return R.map((route) => {
    const path = combinePaths(parentPath, route.path);
    return R.mergeRight(route, {
      path,
      routes: route.routes && buildPaths(route.routes, path),
    });
  }, routes);
}

export default function Routes({
  automata,
  user,
  authenticated,
  onSnackbarOpen,
}: RoutesProps) {
  const withAutomaton = (
    renderAutomatonComponent: (props: AutomatonComponentProps) => React.ReactNode,
    routeProps: RouteComponentProps<AutomatonParams>,
  ) => {
    const { automatonId } = routeProps.match.params;
    const automaton = dbToAutomaton(automata.child(automatonId).val());
    const automatonIndex = R.indexOf(automatonId, R.keys(automata.val()));
    if (!automata.hasChild(automatonId)) {
      return (
        <Alert severity="error">
          Automaton not found.
        </Alert>
      );
    }

    return renderAutomatonComponent({
      automaton,
      automatonIndex,
      automatonId,
    });
  };

  const routes: RouteData[] = [
    {
      path: "/",
      render: () => (
        <Home
          automata={automata}
          // onAutomataChange={setAutomata}
          openSnackbar={() => onSnackbarOpen("automatonDeleted")}
          user={user}
        />
      ),
      isPrivate: true,
      routes: [
        {
          path: "/automata",
          render: () => (
            <Home
              automata={automata}
              // onAutomataChange={setAutomata}
              openSnackbar={() => onSnackbarOpen("automatonDeleted")}
              user={user}
            />
          ),
          isPrivate: true,
          routes: [
            {
              path: "/new",
              render: () => (
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
              ),
              isPrivate: true,
            },
            {
              path: "/:automatonId",
              render: (routeProps) => withAutomaton(({ automaton }) => (
                <View automaton={automaton} />
              ), routeProps),
              isPrivate: true,
              routes: [
                {
                  path: "/edit",
                  render: (routeProps) => withAutomaton(({
                    automaton,
                    automatonIndex,
                    automatonId,
                  }) => (
                    <Input
                      automaton={automaton}
                      automatonIndex={automatonIndex}
                      automatonId={automatonId}
                      // addAutomaton={addAutomaton}
                      onSnackbarOpen={onSnackbarOpen}
                      openStateDeletedSnackbar={() => onSnackbarOpen("stateDeleted")}
                      openTransitionDeletedSnackbar={() => onSnackbarOpen("transitionDeleted")}
                      user={user}
                    />
                  ), routeProps),
                  isPrivate: true,
                },
                {
                  path: "/run",
                  render: (routeProps) => withAutomaton(({ automaton }) => (
                    <RunComponent automaton={automaton} />
                  ), routeProps),
                  isPrivate: true,
                },
                {
                  path: "/determinized",
                  render: (routeProps) => withAutomaton(({ automaton }) => (
                    <View automaton={determinize(automaton)} />
                  ), routeProps),
                  isPrivate: true,
                },
                {
                  path: "/minimized",
                  render: (routeProps) => withAutomaton(({ automaton }) => (
                    <View automaton={minimize(automaton)} />
                  ), routeProps),
                  isPrivate: true,
                },
              ],
            },
          ],
        },
        {
          path: "/login",
          render: () => <Login />,
          isPrivate: false,
        },
      ],
    },
  ];

  // Apply redirection logic based whether the route is public or private
  // If private (i.e. route should only be accessible when logged in), then redirect to login page
  // if NOT logged in
  // If public (i.e. route should only be accessible when NOT logged in), redirect to homepage if
  // logged in
  const applyPublic = (render: RouteRenderFunction) => (!authenticated ? render : () => <Redirect to="/" />);
  const applyPrivate = (render: RouteRenderFunction) => (authenticated ? render : () => <Redirect to="/login" />);

console.log(flattenRoutes(buildPaths(routes)));

  return (
    <Switch>
      {flattenRoutes(buildPaths(routes)).map((route) => (
        <Route
          key={route.path}
          authenticated={authenticated}
          path={route.path}
          render={(route.isPrivate ? applyPrivate : applyPublic)(route.render)}
        />
      ))}
    </Switch>
  );
}
