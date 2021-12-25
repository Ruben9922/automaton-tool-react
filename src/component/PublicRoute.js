import React from "react";
import { Route, Redirect } from "react-router-dom";

export default function PublicRoute({ children, authenticated, ...rest }) {
  return (
    <Route {...rest}>
      {authenticated === false ? children : <Redirect to="/" />}
    </Route>
  );
}
