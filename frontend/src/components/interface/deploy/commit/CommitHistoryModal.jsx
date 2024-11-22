// React imports
import React from "react";
// Library imports
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Modal, ModalBody, ModalHeader, ModalFooter } from "reactstrap";
import CommitBlock from "./CommitBlock";

// Components

const CommitHistoryModal = (props) => {
  const { toggleModalState, commits, commitModalState } = props;
  return (
    <Modal
      className="query-modal-columns"
      isOpen={commitModalState}
      toggle={toggleModalState}
      style={{ top: "5%", minWidth: "800px" }}
    >
      <ModalHeader className="modal-header clearfix">
        <div className="float-left">Commit History</div>
        <Button
          className="float-right"
          color="falcon-danger"
          onClick={toggleModalState}
          size="sm"
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </ModalHeader>
      <ModalBody className="query-modal-columns-body deploy-repo-commit-modal-body">
        <div
          style={{
            padding: "0px 10px 20px 10px",
          }}
        >
          {commits?.map((commit, index) => (
            <CommitBlock commit={commit} key={index} />
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <div className="query-modal-columns-vanilla-footer">
          <Button block color="falcon-danger" onClick={toggleModalState}>
            Close &nbsp;
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CommitHistoryModal;
