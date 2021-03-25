import React from 'react';
import { Route, Redirect } from "react-router-dom";

export default function PrivateRoute({ children, authenticated, ...rest }) {
  return (
    <Route {...rest}>
      {authenticated === true
        ? children
        : <Redirect to="/login" />}
    </Route>
  );
}
