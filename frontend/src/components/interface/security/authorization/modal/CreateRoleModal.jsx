// React imports
import React, { useEffect,  useState } from "react";

// Library imports
import { faPlus, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import CustomSelect from "../../../../common/CustomSelect";

// Custom libraries

// API

// Abort controllers for cancelling network requests

const CreateRoleModal = (props) => {
  // Props
  const {
    roleTypeOptions,

    createRole,
    modalHandler,
    modalState,
    closeModal,
    selectedRow,
  } = props;

  const [roleName, setRoleName] = useState("");
  const [roleValue, setRoleValue] = useState("");
  const [roleType, setRoleType] = useState(null);

  useEffect(() => {
    if (selectedRow) {
      setRoleName(selectedRow.name);
      setRoleValue(selectedRow.role_value);
      setRoleType(
        roleTypeOptions.find((item) => item.value === selectedRow.role_type_id)
      );
    } else {
      setRoleName("");
      setRoleValue("");
      setRoleType(null);
    }
  }, [selectedRow]);

  const updateSelectedRole = (value) => {
    setRoleType(value);
  };

  const updateRoleName = (event) => {
    setRoleName(event.target.value);
  };
  const updateRoleValue = (event) => {
    setRoleValue(event.target.value);
  };

  const handleCreateRole = (event) => {
    createRole({
      roleName,
      roleValue,
      roleType: roleType.value,
    });
  };

  const renderModalBody = () => {
    return (
      <div className="database-modal-enum-body-toolbar">
        <div className="database-modal-enum-body-toolbar-field">
          <Input
            //   autoFocus={selectedRow ? true : false}
            className="database-modal-enum-body-toolbar-field-input"
            onChange={updateRoleName}
            placeholder="Enter Role Name"
            name="roleName"
            value={roleName}
            disabled={Boolean(selectedRow)}
          />
        </div>
        <div className="database-modal-enum-body-toolbar-field">
          <Input
            //   autoFocus={selectedRow ? true : false}
            className="database-modal-enum-body-toolbar-field-input"
            onChange={updateRoleValue}
            placeholder="Enter Role Value (optional)"
            name="roleValue"
            value={roleValue}
            disabled={Boolean(selectedRow)}
          />
        </div>

        <div className="database-modal-enum-body-toolbar-field">
          <CustomSelect
            // autoFocus={state.tableSelected ? true : false}
            classNamePrefix="react-select"
            noOptionsMessage={() => "No Type match the search term"}
            onChange={updateSelectedRole}
            options={roleTypeOptions}
            name="roleType"
            placeholder="Select Role Type"
            value={roleType}
            isClearable="true"
            isDisabled={Boolean(selectedRow)}
          />
        </div>
      </div>
    );
  };

  return (
    <Modal
      className="database-modal-enum"
      isOpen={modalState}
      toggle={modalHandler}
    >
      <ModalHeader className="modal-header clearfix">
        <div className="float-left">{selectedRow ?  "Edit" : "Create" } Role</div>
        <Button
          className="float-right"
          color="falcon-danger"
          size="sm"
          onClick={closeModal}
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </ModalHeader>
      <ModalBody className="database-modal-enum-body">
        {renderModalBody()}
      </ModalBody>
      <ModalFooter>
        <div className="dashboard-modal-share-buttons"  style={{display : 'flex' , width:'100%'}}>
          <div className="dashboard-modal-share-button"  style={{width: "100%" ,paddingRight: '7px'}} >
            <Button block color="falcon-danger" onClick={closeModal} style={{width: "100%"}}>
              Close &nbsp;
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </div>
          <div className="dashboard-modal-share-button" style={{width: "100%" ,paddingLeft: '7px'}}> 
            <Button
              color="falcon-success"
              disabled={(!(roleName?.trim() && roleType) || Boolean(selectedRow))}
              onClick={handleCreateRole}
              style={{width: "100%"}}
            >
              {selectedRow ? (
                <>
                  {" "}
                  Save &nbsp;
                  <FontAwesomeIcon icon={faSave} />
                </>
              ) : (
                <>
                  {" "}
                  Add &nbsp;
                  <FontAwesomeIcon icon={faPlus} />
                </>
              )}
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CreateRoleModal;
