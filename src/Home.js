import React from "react";
import Input from "./Input";
import View from "./View";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Fab from "@material-ui/core/Fab";
import AddIcon from '@material-ui/icons/Add';
import {makeStyles} from "@material-ui/core/styles";
import {Link} from "react-router-dom";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";

const useStyles = makeStyles((theme) => ({
    fab: {
        position: 'absolute',
        bottom: theme.spacing(4),
        right: theme.spacing(4),
    },
}));

export default function Home({automata, onAutomataChange, onSnackbarOpenChange}) {
    const classes = useStyles();

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [automatonDeleteIndex, setAutomatonDeleteIndex] = React.useState(null);

    const handleRemoveAutomatonClick = index => {
        setAutomatonDeleteIndex(index);
        setDialogOpen(true);
    }

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        onSnackbarOpenChange(false);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleDialogConfirmClick = () => {
        onAutomataChange(prevAutomata => prevAutomata.delete(automatonDeleteIndex));
        onSnackbarOpenChange(true);
        setDialogOpen(false);
    };

    return (
        <>
            {automata.isEmpty() ? (
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
                    {automata.map((automaton, index) => (
                        <React.Fragment key={index}>
                        <ListItem key={index}>
                            <ListItemText
                                primary={`Automaton ${index + 1}`}
                                secondary={`${automaton.get("alphabet").count()} symbols, ${automaton.get("states").count()} states, ${automaton.get("transitionFunction").count()} transitions`}
                            />
                        </ListItem>
                        <Tooltip title={`Delete Automaton ${index + 1}`}>
                            <IconButton onClick={() => handleRemoveAutomatonClick(index)} aria-label="delete">
                                <DeleteIcon/>
                            </IconButton>
                        </Tooltip>
                        </React.Fragment>
                    ))}
                </List>
            )}
            <Link to="/create">
                <Tooltip title="Add automaton" className={classes.fab}>
                    <Fab color="primary" aria-label="add">
                        <AddIcon/>
                    </Fab>
                </Tooltip>
            </Link>
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Delete automaton?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you wish to permanently delete Automaton {automatonDeleteIndex + 1}? This cannot be undone.
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
