import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";

type PublicRouteProps = {
  children: React.ReactNode;
  authenticated: boolean;
} & RouteProps;

export default function PublicRoute({ children, authenticated, ...rest }: PublicRouteProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Route {...rest}>
      {!authenticated ? children : <Redirect to="/" />}
    </Route>
  );
}
