// React imports
import React from "react";

// Library imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Button, Modal, ModalBody, ModalHeader, ModalFooter } from "reactstrap";

const DeleteDomainModal = (props) => {
  const { modalState, closeModal, selectedDomain, removeDomain } = props;

  return (
    <Modal
      className="apps-modal-delete"
      isOpen={modalState}
      toggle={closeModal}
    >
      <ModalHeader className="modal-header clearfix">
        <div className="float-left">Delete CORS Domain</div>
        <Button
          className="float-right"
          color="falcon-danger"
          size="sm"
          onClick={closeModal}
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </ModalHeader>
      <ModalBody className="apps-modal-delete-body">
        This action deletes
        <span className="confirmation-span pre">{selectedDomain}</span>. This
        action cannot be undone.
      </ModalBody>
      <ModalFooter>
        <Button block color="danger" onClick={removeDomain}>
          Delete &nbsp;
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteDomainModal;
