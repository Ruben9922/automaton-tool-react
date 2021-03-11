import React from 'react';
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import {makeStyles, Theme} from "@material-ui/core/styles";
import Automaton from "../core/automaton";
import {Run, RunTree} from "../core/run";
import {TreeItem, TreeView} from "@material-ui/lab";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import FormControl from "@material-ui/core/FormControl";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
      width: '25ch',
    },
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

  // TODO: Check input only contains symbols in the automaton's alphabet
  // TODO: Maybe add options for epsilion closure - e.g. display effect of epsilon closure after each input symbol
  // TODO: Show run result (i.e. "accepted" or "rejected")
  // TODO: Maybe rename "set view"
  // TODO: Add explanation
  // TODO: Expand all & collapse all buttons
  return (
    <>
      <form className={classes.root} autoComplete="off">
        <TextField
          id="input"
          label="Input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <Button
          variant="contained"
          onClick={() => {
            setRun(automaton.run(input));
            setRunTree(automaton.runTree(input));
          }}
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
