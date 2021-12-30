import React from "react";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { TreeItem, TreeView } from "@material-ui/lab";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import FormControl from "@material-ui/core/FormControl";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import Paper from "@material-ui/core/Paper";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import { Run, RunTree } from "../core/run";
import Automaton, { accepts, computeRun, computeRunTree } from "../core/automaton";
import { isSubset } from "../core/utilities";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
      width: "25ch",
    },
  },
  paper: {
    margin: theme.spacing(1),
    // padding: theme.spacing(1),
    // display: "inline-block",
    width: theme.spacing(16),
    height: theme.spacing(16),
    textAlign: "center",
    // padding: theme.spacing(3),
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
}));

type RunView = "setView" | "treeView";

type RunProps = {
  automaton: Automaton;
};

export default function RunComponent({ automaton }: RunProps) {
  const classes = useStyles();

  const [input, setInput] = React.useState("");
  const [run, setRun] = React.useState<Run | null>(null);
  const [runTree, setRunTree] = React.useState<RunTree | null>(null);
  const [runView, setRunView] = React.useState<RunView>("setView");

  const renderTree = (tree: RunTree) => tree.map((node) => (
    <TreeItem key={node.id} nodeId={node.id} label={`${node.state} (${node.symbol ?? "Initial"})`}>
      {renderTree(node.children)}
    </TreeItem>
  ));

  const inputValid = isSubset(input.split(""), automaton.alphabet);

  // TODO: Maybe add options for epsilion closure - e.g. display effect of epsilon closure after
  //  each input symbol
  // TODO: Maybe rename "set view"
  // TODO: Add explanation
  // TODO: Expand all & collapse all buttons
  return (
    <>
      <form className={classes.root} autoComplete="off" onSubmit={(event) => event.preventDefault()}>
        <TextField
          id="input"
          label="Input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          error={!inputValid}
          helperText={inputValid ? "" : "Input can only contain alphabet symbols"}
        />
        <Button
          type="submit"
          variant="contained"
          onClick={() => {
            setRun(computeRun(automaton, input));
            setRunTree(computeRunTree(automaton, input));
          }}
          disabled={!inputValid}
        >
          Run
        </Button>
      </form>
      <FormControl component="fieldset">
        <RadioGroup
          row
          aria-label="runView"
          name="runView"
          value={runView}
          onChange={(event) => setRunView(event.target.value as RunView)}
        >
          <FormControlLabel
            value="setView"
            control={<Radio />}
            label="Set view"
          />
          <FormControlLabel
            value="treeView"
            control={<Radio />}
            label="Tree view"
          />
        </RadioGroup>
      </FormControl>
      {run && (
        <Paper className={classes.paper}>
          <div>
            {accepts(automaton, run) ? <CheckIcon fontSize="large" /> : <CloseIcon fontSize="large" />}
            <p style={{ margin: 0 }}>{accepts(automaton, run) ? "Accepted" : "Rejected"}</p>
          </div>
        </Paper>
      )}
      {runView !== "treeView" ? (
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          {run?.map((runItem, runItemIndex) => (
            <TreeItem nodeId={runItemIndex.toString()} key={runItemIndex} label={runItem.symbol || "[Initial]"}>
              {runItem.states.map((state, stateIndex) => (
                <TreeItem nodeId={`${runItemIndex}-${stateIndex}`} key={stateIndex} label={state} />
              ))}
            </TreeItem>
          ))}
        </TreeView>
      ) : (
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          {runTree && renderTree(runTree)}
        </TreeView>
      )}
    </>
  );
}
