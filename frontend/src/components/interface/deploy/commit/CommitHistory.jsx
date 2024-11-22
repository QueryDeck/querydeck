// React imports
import React from "react";
import CommitHistoryModal from "./CommitHistoryModal";
import CommitBlock from "./CommitBlock";

const Commits = ({
  commits,
  repoUrl,
  commitModalState,
  toggleCommitModalState,
}) => {
  // Redux

  if (!commits || !commits.length) {
    return <div style={{ height: "61px" }}></div>;
  }
  return (
    <>
      <CommitBlock
        commit={commits[0]}
        repoUrl={repoUrl}
        componentType={"header"}
        toggleCommitModalState={toggleCommitModalState}
      />
      <CommitHistoryModal
        commits={commits}
        commitModalState={commitModalState}
        toggleModalState={toggleCommitModalState}
      />
    </>
  );
};

export default Commits;
