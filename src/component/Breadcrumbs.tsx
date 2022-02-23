import React from "react";
import Link, { LinkProps } from "@material-ui/core/Link";
import { Link as RouterLink, match as Match, useRouteMatch } from "react-router-dom";
import MuiBreadcrumbs from "@material-ui/core/Breadcrumbs";
import Typography from "@material-ui/core/Typography";
import * as R from "ramda";
import Automaton from "../core/automaton";
import AutomatonParams from "./AutomatonParams";

function LinkRouter(props: LinkProps<RouterLink>) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Link {...props} component={RouterLink} />;
}

interface Breadcrumb {
  url: string;
  name: string;
}

function createBreadcrumbs(match: Match<AutomatonParams>, automatonName?: string): Breadcrumb[] {
  let breadcrumbNameMap: Record<string, string> = {
    "/": "Home",
    "/automata": "Home",
    "/automata/new": "Create new automaton",
    "/login": "Log In",
  };

  if (match.params.automatonId !== undefined && automatonName !== undefined) {
    breadcrumbNameMap = R.mergeRight(breadcrumbNameMap, {
      [`/automata/${match.params.automatonId}`]: automatonName,
      [`/automata/${match.params.automatonId}/edit`]: "Edit Automaton",
      [`/automata/${match.params.automatonId}/run`]: "Run Automaton",
      [`/automata/${match.params.automatonId}/determinized`]: "Determinise Automaton",
      [`/automata/${match.params.automatonId}/minimized`]: "Minimise Automaton",
      [`/automata/${match.params.automatonId}/convert-to-regex`]: "Convert to Regex",
    });
  }

  let urlSegments = match.url.split("/");

  // Remove first segment if empty, to prevent 2 "Home" breadcrumbs
  if (R.isEmpty(R.head(urlSegments))) {
    urlSegments = R.tail(urlSegments);
  }

  const breadcrumbUrls = R.reduce((acc: string[], elem: string) => (R.isEmpty(acc) ? [`/${elem}`] : R.append(`${R.last(acc)!}/${elem}`, acc)), [], urlSegments);

  // If the path doesn't exist in `breadcrumbNameMap` then just use the path segment
  const breadcrumbNames = R.addIndex<string, string>(R.map)(
    (path, index) => breadcrumbNameMap[path] ?? urlSegments[index],
    breadcrumbUrls,
  );

  // Zip the two arrays together into an array of Breadcrumb objects
  return R.zipWith((url: string, name: string) => ({ url, name }), breadcrumbUrls, breadcrumbNames);
}

type BreadcrumbsProps = {
  automaton: Automaton | null;
};

export default function Breadcrumbs({ automaton }: BreadcrumbsProps) {
  const match = useRouteMatch<AutomatonParams>();
  const breadcrumbs = createBreadcrumbs(match, automaton?.name);

  return (
    <MuiBreadcrumbs aria-label="breadcrumb">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === R.length(breadcrumbs) - 1;
        return isLast ? (
          <Typography color="textPrimary" key={breadcrumb.url}>
            {breadcrumb.name}
          </Typography>
        ) : (
          <LinkRouter color="inherit" to={breadcrumb.url} key={breadcrumb.url}>
            {breadcrumb.name}
          </LinkRouter>
        );
      })}
    </MuiBreadcrumbs>
  );
}
