import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";

type PrivateRouteProps = {
  children: React.ReactNode;
  authenticated: boolean;
} & RouteProps;

export default function PrivateRoute({ children, authenticated, ...rest }: PrivateRouteProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Route {...rest}>
      {authenticated ? children : <Redirect to="/login" />}
    </Route>
  );
}
