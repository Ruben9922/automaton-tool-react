import React from "react";
import Typography from "@material-ui/core/Typography";
import Fab from "@material-ui/core/Fab";
import AddIcon from '@material-ui/icons/Add';
import {makeStyles, Theme} from "@material-ui/core/styles";
import {Link} from "react-router-dom";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import * as R from "ramda";
import Dialog from "./Dialog";
import {dbToAutomaton} from "../core/automaton";
import firebase from "../firebase";

const useStyles = makeStyles((theme: Theme) => ({
  fab: {
    position: 'absolute',
    bottom: theme.spacing(4),
    right: theme.spacing(4),
  },
}));

type HomeProps = {
  automata: any; // TODO: Fix this
  // onAutomataChange: Dispatch<SetStateAction<Automaton[]>>;
  openSnackbar: () => void;
};

export default function Home({
  automata,
  // onAutomataChange,
  openSnackbar,
}: HomeProps) {
  const classes = useStyles();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [automatonDeleteId, setAutomatonDeleteId] = React.useState<string | null>(null);

  const handleRemoveAutomatonClick = (id: string): void => {
    setAutomatonDeleteId(id);
    setDialogOpen(true);
  };

  const handleDialogConfirmClick = (): void => {
    const automataRef = firebase.database().ref("automata");
    automataRef.child(automatonDeleteId!).remove(); // TODO: Implement .then()

    setAutomatonDeleteId(null); // Put in .then()
    openSnackbar(); // Put in .then()
    setDialogOpen(false);
  };

  const automaton = automatonDeleteId ? dbToAutomaton(automata.child(automatonDeleteId).val()) : null;

  // TODO: Replace "/automata" link with url variable
  return (
    <>
      {!automata.hasChildren() ? (
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
          {Object.entries(automata.val()).map(([key, value], index: number) => {
            const automaton = dbToAutomaton(value);

            return (
              <ListItem key={key} button component={Link} to={`/automata/${key}`} style={{ paddingRight: 100 }}>
                <ListItemText
                  primary={automaton.name}
                  secondary={`${R.length(automaton.alphabet)} symbols, ${R.length(automaton.states)} states, ${automaton.transitionFunction.size} transitions`}
                />
                <ListItemSecondaryAction>
                  <Tooltip title={`Edit Automaton ${index + 1}`}>
                    <IconButton component={Link} to={`/automata/${key}/edit`} aria-label="edit">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={`Delete Automaton ${index + 1}`}>
                    <IconButton onClick={() => handleRemoveAutomatonClick(key)} aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      )}
      <Tooltip title="Add automaton" className={classes.fab}>
        <Fab component={Link} to="/automata/new" color="primary" aria-label="add">
          <AddIcon />
        </Fab>
      </Tooltip>
      <Dialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        title="Delete automaton?"
        message={`Are you sure you wish to permanently delete Automaton "${automaton?.name}"? This cannot be undone.`}
        buttons={[
          {
            content: "Cancel",
            onClick: () => setDialogOpen(false),
            color: "primary",
            autoFocus: false,
          },
          {
            content: "Delete",
            onClick: handleDialogConfirmClick,
            color: "primary",
            autoFocus: true,
          },
        ]}
      />
    </>
  );
}
