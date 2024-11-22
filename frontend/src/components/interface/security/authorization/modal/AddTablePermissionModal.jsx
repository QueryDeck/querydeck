// React imports
import React, { useEffect, useState } from "react";


// Reducers

// Library imports
import {   faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "reactstrap";
import CustomSelect from "../../../../common/CustomSelect";

// Abort controllers for cancelling network requests

const AddTablePermissionModal = (props) => {
  // Redux

  const [selectedTable, setSelectedTable] = useState(null);

  // Props
  const {
 
    addTableToPermission,
    closeModal,
    modalState,
 
    state,
  } = props;
 

  useEffect(() => {
    updateTableSelected (null)
    // eslint-disable-next-line
  }, [modalState]);


  const updateTableSelected = (value) => {
    setSelectedTable(value);
  };

  const renderModalBody = () => {
    if (state.loading) {
      return (
        <div className="list-deck list-deck-middle">
          <div className="loading-div">
            <Spinner className="loading-spinner" color="primary" type="grow" />
          </div>
        </div>
      );
    } else {
      return (
        <div className="database-modal-enum-body-toolbar">
          <div className="database-modal-enum-body-toolbar-field">
            <CustomSelect
              autoFocus={true}
              classNamePrefix="react-select"
              defaultMenuIsOpen={true}
              noOptionsMessage={() => "No tables match the search term"}
              onChange={(value) => updateTableSelected(value)}
              options={state.tableOptions}
              placeholder="Select Table"
              value={selectedTable}
              isClearable="true"
            />
          </div>
        </div>
      );
    }
  };

  return (
    <Modal
      className="apps-modal-delete"
      isOpen={modalState}
      toggle={closeModal}
      style={{ top: "15%" }}
    >
      <ModalHeader className="modal-header clearfix">
        <div className="float-left">Add Table </div>
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
        {renderModalBody()}
      </ModalBody>

      <ModalFooter>
        <Button
          block
          color="falcon-success"
          onClick={() => addTableToPermission(selectedTable)}
          disabled={!Boolean(selectedTable)}
        >
          Save <FontAwesomeIcon icon={faSave} />
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddTablePermissionModal;
