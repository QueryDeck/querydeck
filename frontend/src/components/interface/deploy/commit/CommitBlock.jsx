// React imports
import React from "react";
import { Button } from "reactstrap";
import GitHubIcon from "@mui/icons-material/GitHub";

import timeCalculator from "../../../../timeCalculator.js";
import { textSlicer } from "../../../../helpers/utils.js";
import CommitIcon from "@mui/icons-material/Commit";

const CommitBlock = ({
  commit,
  repoUrl,
  toggleCommitModalState,
  componentType,
}) => {
  if (componentType === "header") {
    return (
      <div className="overview-details-row-bx deploy-repo-commit-head-bx">
        <div className="overview-details-row-label deploy-repo-commit-head-bx-left">
          <GitHubIcon />
          <div className="deploy-repo-commit-head-bx-left-url">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={repoUrl}
            >
              {repoUrl?.split("/").pop()}
            </a>
          </div>
          <div
            className="deploy-repo-commit-head-bx-left-message"
            title={commit.message}
          >
            {textSlicer(commit.message, 40)}
          </div>
        </div>
        <div className="deploy-repo-commit-head-bx-right">
          <span>
            {timeCalculator(new Date(commit.time).getTime() / 1000, true)}
          </span>
          &nbsp;&nbsp;
          <Button
            color="falcon-success"
            onClick={toggleCommitModalState}
            size="sm"
          >
            History
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="overview-details-row-bx deploy-repo-commit-head-bx">
        <div className="overview-details-row-label deploy-repo-commit-head-bx-left">
          <CommitIcon style={{ transform: "rotateZ(0deg)" }} />
          <div className="deploy-repo-commit-head-bx-left-url"></div>
          <div
            className="deploy-repo-commit-head-bx-left-message"
            title={commit.message}
          >
            {textSlicer(commit.message, 60)}
          </div>
        </div>
        <div className="deploy-repo-commit-head-bx-right">
          <span>
            {timeCalculator(new Date(commit.time).getTime() / 1000, true)}
          </span>
          &nbsp;&nbsp;
        </div>
      </div>
    );
  }
};

export default CommitBlock;
