// React imports
import React, { useEffect, useState, useRef ,useMemo } from "react";
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
import Filters from "../../../../../app/projects/[subdomain]/components/filters/index.jsx";
// /home/mohan/DRIVE-D/query-chart/qd-frontend/src/app/projects/[subdomain]/components/filters/index.jsx
 
 
// Abort controllers for cancelling network requests
const accessTypeOptions = [
  { label: "No Access", value: -1 },
  { label: "Custom Access", value: 0 },
  { label: "Full Access", value: 1 },
];

const EditTablePermissionModal = (props) => {

  const getFiltersRef = useRef({});
  // Props
  const {
    closeModal,
    modalState,
    state,
    updateRole, 
  } = props;
  const filterInitialState ={
    condition: "AND",
    id: "root",
    rules: [],
    not: false,
  } 
  const [selectedAccessType, setSelectedAccessType] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(filterInitialState);
 const currentAccessTypeOptions = useMemo(() => {
   return accessTypeOptions.filter((item) => {
     if (
       state?.selectedPermisson?.method === "insert" &&
       item.label === "Custom Access"
     ) {
       return false;
     }
     return true;
   });
 }, [state?.selectedPermisson?.method]);
 
  useEffect(() => {
    if(state.selectedPermisson?.cellDetail ){ 
      setSelectedAccessType( accessTypeOptions.find((item)=> item.value === state.selectedPermisson.cellDetail.access_type)) ;

    if (state.selectedPermisson.cellDetail.access_type === 0) {
      if (state.selectedPermisson.cellDetail.conditions) {
        setSelectedFilters(state.selectedPermisson.cellDetail.conditions);
      }else { 
         setSelectedFilters(filterInitialState)
      }
    }
    else { 
      setSelectedFilters(filterInitialState)
   }
  }

  }, [modalState]);
  const savePermissionChange = () => {
    let currentFilters =
      selectedAccessType.value === 0
        ? getFiltersRef.current.getFilters()
        : null;
 

    updateRole({
      filters: currentFilters,
      accessTypeValue: selectedAccessType.value,
    });
 
  };
 
  const updateAccessType = (value) => {
    setSelectedAccessType(value);
  };
 
 
  return (
    <Modal
      isOpen={modalState}
      className="query-modal-filter"
      toggle={closeModal}
    >
      <ModalHeader className="modal-header clearfix">
        <div className="float-left">Edit Permission |  {state?.selectedPermisson?.tableName}   [{state?.selectedPermisson?.method }] </div>
        <Button
          className="float-right"
          color="falcon-danger"
          size="sm"
          onClick={closeModal}
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </ModalHeader>
      <ModalBody className="query-modal-filter-body">
        <br />

        <div className="database-modal-enum-body-toolbar-field">
          <CustomSelect
            // autoFocus={state.tableSelected ? true : false}
            classNamePrefix="react-select"
            noOptionsMessage={() => "No Access match the search term"}
            onChange={updateAccessType}
            options={currentAccessTypeOptions}
            name="accessType"
            placeholder="Select Access Type"
            value={selectedAccessType}
            isClearable="true"
          />
        </div>
        <br />
        {selectedAccessType?.value === 0 ? (
          <div className="query-modal-filter-body-container">
            {
              state?.filterFields && 
          
              state?.joinGraphs &&
              selectedFilters &&
              state?.authDetails?.appAuth &&
              state?.operators ? (
                <Filters
                  ref={getFiltersRef}
                  catchError={props.catchError}
                  db_id={props.db_id}
                  fields={state?.filterFields}
                  filters={ selectedFilters}
                  joinGraphs={state?.joinGraphs}
                  operators={state?.operators}
                  sessionKeys={state?.authDetails?.appAuth  }
                  mode={`api-select-filters`}
                  subdomain={props.subdomain}
                />
              ) : (
                <div className="loading-div">
                  <Spinner
                    className="loading-spinner"
                    color="primary"
                    type="grow"
                  />
                </div>
              )
            }
          </div>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <div className="query-modal-filter-footer">
          <Button block color="falcon-danger" onClick={closeModal}>
            Close &nbsp;
            <FontAwesomeIcon icon={faTimes} />
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            block
            color="falcon-success"
            onClick={savePermissionChange}
            disabled={!Boolean(selectedAccessType)}
          >
            Save &nbsp;
            <FontAwesomeIcon icon={faSave} />
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default EditTablePermissionModal;


