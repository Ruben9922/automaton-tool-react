import React from "react";
import { Typography } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import Diagram from "./Diagram";
import Automaton, { convertNfaToRegex } from "../core/automaton";
import { convertRegexToString } from "../core/regex";

type ConvertToRegexProps = {
  automaton: Automaton;
};

export default function ConvertToRegex({ automaton }: ConvertToRegexProps) {
  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Convert {automaton.name} to Regex
      </Typography>
      <Diagram automaton={automaton} />
      <Paper>
        <p style={{ margin: 0 }}>
          {convertRegexToString(convertNfaToRegex(automaton))}
        </p>
      </Paper>
    </>
  );
}
