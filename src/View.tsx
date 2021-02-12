import React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";

type ViewParams = {
  automatonIndex: string;
};

type ViewProps = RouteComponentProps<ViewParams>;

function View({ match }: ViewProps) {
  return (
    // eslint-disable-next-line react/jsx-one-expression-per-line
    <p>Automaton index: {match.params.automatonIndex}</p>
  );
}

export default withRouter(View);
