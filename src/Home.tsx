import React, { Dispatch, SetStateAction } from "react";
import Typography from "@material-ui/core/Typography";
import Fab from "@material-ui/core/Fab";
import AddIcon from '@material-ui/icons/Add';
import { makeStyles, Theme } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";
import * as R from "ramda";
import Automaton from "./automaton";

const useStyles = makeStyles((theme: Theme) => ({
  fab: {
    position: 'absolute',
    bottom: theme.spacing(4),
    right: theme.spacing(4),
  },
}));

type HomeProps = {
  automata: Automaton[];
  onAutomataChange: Dispatch<SetStateAction<Automaton[]>>;
  openSnackbar: () => void;
};

export default function Home({ automata, onAutomataChange, openSnackbar }: HomeProps) {
  const classes = useStyles();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [automatonDeleteIndex, setAutomatonDeleteIndex] = React.useState<number | null>(null);

  const handleRemoveAutomatonClick = (index: number): void => {
    setAutomatonDeleteIndex(index);
    setDialogOpen(true);
  };

  const handleDialogClose = (): void => {
    setDialogOpen(false);
  };

  const handleDialogConfirmClick = (): void => {
    onAutomataChange((prevAutomata) => R.remove(automatonDeleteIndex as number, 1, prevAutomata));
    openSnackbar();
    setDialogOpen(false);
  };

  return (
    <>
      {R.isEmpty(automata) ? (
        <>
          <Typography variant="h5" component="h1" gutterBottom>
            Welcome to Automaton Tool!
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            No automata saved yet! Create an automaton and it will show up here.
          </Typography>
        </>
      ) : (
        <List>
          {automata.map((automaton: Automaton, index: number) => (
            <React.Fragment key={automaton.id}>
              <ListItem>
                <ListItemText
                  primary={`Automaton ${index + 1}`}
                  secondary={`${R.length(automaton.alphabet)} symbols, ${R.length(automaton.states)} states, ${automaton.transitionFunction.size} transitions`}
                />
              </ListItem>
              <Tooltip title={`Delete Automaton ${index + 1}`}>
                <IconButton onClick={() => handleRemoveAutomatonClick(index)} aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </React.Fragment>
          ))}
        </List>
      )}
      <Link to="/create">
        <Tooltip title="Add automaton" className={classes.fab}>
          <Fab color="primary" aria-label="add">
            <AddIcon />
          </Fab>
        </Tooltip>
      </Link>
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete automaton?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {`Are you sure you wish to permanently delete Automaton ${automatonDeleteIndex! + 1}? This cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogConfirmClick} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
