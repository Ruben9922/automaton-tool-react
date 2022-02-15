import React from "react";
import Link, { LinkProps } from "@material-ui/core/Link";
import { Link as RouterLink, match as Match, useRouteMatch } from "react-router-dom";
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

interface Breadcrumb {
  path: string;
  url: string;
  name: string;
}

function createBreadcrumbs(match: Match<Record<string, string>>): Breadcrumb[] {
  let pathSegments = match.path.split("/");
  let urlSegments = match.url.split("/");

  // Remove first segment if empty, to prevent 2 "Home" breadcrumbs
  if (R.isEmpty(R.head(pathSegments))) {
    pathSegments = R.tail(pathSegments);
  }
  if (R.isEmpty(R.head(urlSegments))) {
    urlSegments = R.tail(urlSegments);
  }

  const breadcrumbPaths = R.reduce((acc: string[], elem: string) => (R.isEmpty(acc) ? [`/${elem}`] : R.append(`${R.last(acc)!}/${elem}`, acc)), [], pathSegments);
  const breadcrumbUrls = R.reduce((acc: string[], elem: string) => (R.isEmpty(acc) ? [`/${elem}`] : R.append(`${R.last(acc)!}/${elem}`, acc)), [], urlSegments);

  const objectContainsKey = <T,>(s: string, x: T): boolean => R.includes(s, R.keys(x));
  const breadcrumbNames = R.addIndex<string, string>(R.map)((path, index) => {
    // If the path doesn't exist in `breadcrumbNameMap` then just use the path segment
    if (!objectContainsKey(path, breadcrumbNameMap)) {
      return pathSegments[index];
    }

    let name = breadcrumbNameMap[path];

    if (objectContainsKey(R.tail(name), match.params)) {
      name = match.params[R.tail(name)];
    }

    return name;
  }, breadcrumbPaths);

  // Zip the three arrays together into an array of Breadcrumb objects
  const breadcrumbs = R.zipWith(
    (name: string, [path, url]: [string, string]) => ({ path, url, name }),
    breadcrumbNames,
    R.zip(breadcrumbPaths, breadcrumbUrls),
  );
  return breadcrumbs;
}

export default function Breadcrumbs() {
  const match = useRouteMatch();
  const breadcrumbs = createBreadcrumbs(match);

  return (
    <MuiBreadcrumbs aria-label="breadcrumb">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === R.length(breadcrumbs) - 1;
        return isLast ? (
          <Typography color="textPrimary" key={breadcrumb.path}>
            {breadcrumb.name}
          </Typography>
        ) : (
          <LinkRouter color="inherit" to={breadcrumb.url} key={breadcrumb.path}>
            {breadcrumb.name}
          </LinkRouter>
        );
      })}
    </MuiBreadcrumbs>
  );
}
