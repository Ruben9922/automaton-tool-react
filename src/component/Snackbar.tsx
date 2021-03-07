import React, { Dispatch, SetStateAction } from "react";
import { makeStyles, Theme } from "@material-ui/core/styles";
import MuiSnackbar from "@material-ui/core/Snackbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import * as R from "ramda";
import SnackbarMessage from "../core/snackbarMessage";

const useStyles = makeStyles((theme: Theme) => ({
  close: {
    padding: theme.spacing(0.5),
  },
}));

type SnackbarProps = {
  snackbarQueue: SnackbarMessage[];
  setSnackbarQueue: Dispatch<SetStateAction<SnackbarMessage[]>>;
};

export default function Snackbar({
  snackbarQueue,
  setSnackbarQueue,
}: SnackbarProps) {
  const classes = useStyles();

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<SnackbarMessage | null>(null);

  React.useEffect((): void => {
    if (!R.isEmpty(snackbarQueue) && snackbar === null) {
      // Set a new snack when we don't have an active one
      setSnackbar(R.head(snackbarQueue) as SnackbarMessage);
      setSnackbarQueue((prevSnackbarQueue) => R.tail(prevSnackbarQueue));
      setSnackbarOpen(true);
    } else if (!R.isEmpty(snackbarQueue) && snackbar !== null && snackbarOpen) {
      // Close an active snack when a new one is added
      setSnackbarOpen(false);
    }
  }, [snackbarQueue, snackbar, snackbarOpen]);

  const handleSnackbarClose = (event: object | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    reason?: string): void => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarOpen(false);
  };

  const handleSnackbarExited = (): void => {
    setSnackbar(null);
  };

  return (
    <MuiSnackbar
      key={snackbar ? snackbar.id : null}
      open={snackbarOpen}
      autoHideDuration={6000}
      onClose={handleSnackbarClose}
      onExited={handleSnackbarExited}
      message={snackbar ? snackbar.message : null}
      action={(
        <>
          <Button color="secondary" size="small" onClick={handleSnackbarClose}>
            UNDO
          </Button>
          <IconButton
            aria-label="close"
            color="inherit"
            className={classes.close}
            onClick={handleSnackbarClose}
          >
            <CloseIcon />
          </IconButton>
        </>
      )}
    />
  );
}
