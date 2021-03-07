import React from 'react';
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import {makeStyles, Theme} from "@material-ui/core/styles";
import Automaton from "../core/automaton";
import {Run} from "../core/run";
import {TreeItem, TreeView} from "@material-ui/lab";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
      width: '25ch',
    },
  },
}));

type RunProps = {
  automaton: Automaton;
};

export default function RunComponent({ automaton }: RunProps) {
  const classes = useStyles();

  const [input, setInput] = React.useState("");
  const [run, setRun] = React.useState<Run | null>(null);

  // TODO: Check input only contains symbols in the automaton's alphabet
  return (
    <>
      <form className={classes.root} autoComplete="off">
        <TextField
          id="input"
          label="Input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <Button variant="contained" onClick={() => setRun(automaton.run(input))}>
          Run
        </Button>
      </form>
      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
      >
        {run?.map((runItem, runItemIndex) => (
          <TreeItem nodeId={runItemIndex.toString()} key={runItemIndex} label={runItem.symbol}>
            {runItem.states.map((state, stateIndex) => (
              <TreeItem nodeId={`${runItemIndex}-${stateIndex}`} key={stateIndex} label={state} />
            ))}
          </TreeItem>
        ))}
      </TreeView>
    </>
  );
}
