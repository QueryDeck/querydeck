// React imports
import React from "react";

// Library imports
import { faWrench } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "reactstrap";

import { styled } from "@mui/material/styles";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import ListItemButton from "@mui/material/ListItemButton";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";

const Demo = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

const Div = styled("div")(({ theme }) => ({
  ...theme.typography.button,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1),
  fontWeight: "bolder",
}));

const CollapsableFolder = ({ fileList, title }) => {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(!open);
  };
  if (!fileList || !fileList.length) {
    return null;
  }
  return (
    <>
      <ListItemButton onClick={handleClick}>
        <ListItemIcon>
          <FolderIcon />
        </ListItemIcon>
        <ListItemText primary={title +  ` (${fileList.length})`} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={open}  unmountOnExit >
        <List component="div"   >
          <List dense={true} >
            {fileList.map((line, index) => {
              return (
                <ListItem key={index} className="deploy-repo-diff-bx-item-block">
                  <ListItemIcon></ListItemIcon> -&nbsp; &nbsp; 
                  <ListItemText primary={line} />
                </ListItem>
              );
            })}
          </List>
        </List>
      </Collapse>
    </>
  );
};

const DiffView = ({ diff, diffVerbose, pushChangesToRepo }) => {
  // Redux
  let diffTextSplit = diff.text.split("\n");
  let noOfChanges = diffTextSplit.shift();
  let editedDetails = diffTextSplit.splice(diffTextSplit.length - 3);
  return (
    <>
      <div className="deploy-repo-diff-bx">
      <div className="deploy-repo-diff-footer">
          {editedDetails.map((item, index) => {
            return <span key={index}> {item}</span>;
          })}
        </div>
        <Demo>
          <List dense={false}>
            <Div> {noOfChanges}</Div>
            <CollapsableFolder
              title={"Added Endpoints"}
              fileList={diffVerbose.added}
            />
            <CollapsableFolder
              title={"Modified Endpoints"}
              fileList={diffVerbose.modified}
            />
            <CollapsableFolder
              title={"Deleted Endpoints"}
              fileList={diffVerbose.deleted}
            />
          </List>
        </Demo>

      </div>
      <Button block color="falcon-primary" onClick={pushChangesToRepo}>
        Push changes to your Repository &nbsp;{" "}
        <FontAwesomeIcon icon={faWrench} />
      </Button>{" "}
    </>
  );
};

export default DiffView;
