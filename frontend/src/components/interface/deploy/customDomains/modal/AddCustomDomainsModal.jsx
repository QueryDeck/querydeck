// React imports
import React, { useState, useEffect } from "react";
// Reducers
// Library imports
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";

const AddCustomDomainsModal = (props) => {
  // Props
  const { addDomain, modalState, closeModal } = props;

  const [inputDomain, setInputDomain] = useState("");

  useEffect(() => {
    setInputDomain("");
  }, [modalState]);
  const domainChangeHandler = (event) => {
    setInputDomain(event.target.value);
  };

  return (
    <Modal
      className="apps-modal-delete"
      isOpen={modalState}
      toggle={closeModal}
      unmountOnClose={true}
      style={{ top: "15%" }}
      autoFocus={false}
    >
      <ModalHeader className="modal-header clearfix">
        <div className="float-left">Add Custom Domain</div>
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
        <div
          style={{
            display: "flex",
            padding: "4px 0px",
          }}
        >
          <Input
            onChange={domainChangeHandler}
            placeholder="Enter your domain"
            autoFocus={true}
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          block
          color="falcon-success"
          onClick={() => addDomain(inputDomain)}
          disabled={!Boolean(inputDomain.length)}
        >
          Save <FontAwesomeIcon icon={faSave} />
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddCustomDomainsModal;
