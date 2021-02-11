import React, { Dispatch, SetStateAction } from "react";
import MuiDialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";

interface DialogButton {
  content: string;
  onClick: () => void;
  color?: "inherit" | "primary" | "secondary" | "default";
  autoFocus: boolean;
}

type DialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  message: string;
  buttons: DialogButton[];
};

export default function Dialog({
  open,
  setOpen,
  title,
  message,
  buttons,
}: DialogProps) {
  return (
    <MuiDialog
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {buttons.map((button: DialogButton, index: number) => (
          <Button
            onClick={button.onClick}
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            color={button.color}
            autoFocus={button.autoFocus}
          >
            {button.content}
          </Button>
        ))}
      </DialogActions>
    </MuiDialog>
  );
}
