import React from "react";
import Link, { LinkProps } from "@material-ui/core/Link";
import { Link as RouterLink, useRouteMatch } from "react-router-dom";
import MuiBreadcrumbs from "@material-ui/core/Breadcrumbs";
import Typography from "@material-ui/core/Typography";
import * as R from "ramda";

const breadcrumbNameMap: Record<string, string> = {
  "/": "Home",
  "/automata": "Home",
  "/automata/new": "Create new automaton",
  "/automata/:automatonId": ":automatonId",
  "/automata/:automatonId/edit": "Edit Automaton",
  "/automata/:automatonId/run": "Run Automaton",
  "/automata/:automatonId/determinized": "Determinise Automaton",
  "/automata/:automatonId/minimized": "Minimise Automaton",
  "/login": "Log In",
};

function LinkRouter(props: LinkProps<RouterLink>) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Link {...props} component={RouterLink} />;
}

export default function Breadcrumbs() {
  const match = useRouteMatch<Record<string, string>>();
  let pathNames = match.path.split("/");
  if (R.isEmpty(R.head(pathNames))) {
    pathNames = R.tail(pathNames);
  }

  return (
    <MuiBreadcrumbs aria-label="breadcrumb">
      {pathNames.map((_, index) => {
        const isLast = index === pathNames.length - 1;
        const fullPath = `/${pathNames.slice(0, index + 1).join("/")}`;

        let name = breadcrumbNameMap[fullPath];
        if (R.includes(R.tail(name), R.keys(match.params))) {
          name = match.params[R.tail(name)];
        }

        return isLast ? (
          <Typography color="textPrimary" key={fullPath}>
            {name}
          </Typography>
        ) : (
          <LinkRouter color="inherit" to={fullPath} key={fullPath}>
            {name}
          </LinkRouter>
        );
      })}
    </MuiBreadcrumbs>
  );
}
