// React imports
import React, { useEffect, useReducer } from "react";
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch } from 'react-redux'

// Reducers
import createModalReducer from "../../../reducers/security/paramMap/paramMapModalReducer";

// Library imports
import { faPlus, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Cookies from "js-cookie";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "reactstrap";
import CustomSelect from "../../../common/CustomSelect";
import { toast } from "react-toastify";

// Custom libraries

// API
import api from "../../../../api";

// Abort controllers for cancelling network requests
let getTablesController;
let getNodesController;

const CreateModal = (props) => {
  // Redux
  const reduxDispatch = useDispatch()

  // Props
  const {
    appid,
    db_id,
    modalHandler,
    modalState,
    selectedRow,
    sessionKeyValues,
    updateParamMap,
  } = props;

  // For 403 errors on unauthorised users
  let history = useHistory();

  // Initial state
  const initialState = {
    loading: false,
    paramKey: "",
 
    tableOptions: [],
    tableSelected: null,

    nodesHash: {},
    columnsList: [],
    columnSelected: null,
  
  };
  const [state, dispatch] = useReducer(createModalReducer, initialState);
  useEffect(() => {
    getTablesController = new AbortController();
    getNodesController = new AbortController();

    getTables();
    if (selectedRow) {
      getNodes(selectedRow.column_id.split(".").shift());
      dispatch({
        type: "FILL_SELECTED_DATA",
        selectedRow: selectedRow,
      });
    }

    return () => {
      getTablesController.abort();
      getNodesController.abort();
    };
    // eslint-disable-next-line
  }, []);

  const closeModal = () => {
    dispatch({
      type: "CLEAR_DATA",
    });
    modalHandler();
  };
 
 
  const updateAttribue = (event) => {
    let value = event.target.value;

    // if (event.target.name === "customColumnFormula") {
    //   // value = value.replace(/^\s+|\s+$/g, '') ;
    // } else {
    //   value = value.replace(/^\s+|\s+$/g, "").replace(/\./gm, "_");
    // }

    dispatch({
      type: "UPDATE_ATTRIBUTE",
      field: event.target.name,
      value: value,
    });
  };

  const updateTableOptions = (value) => {
    dispatch({
      type: "UPDATE_TABLE_OPTIONS",
      value,
    });
  };

  const updateNodes = (nodes, tableId) => {
    dispatch({
      type: "UPDATE_NODES",
      value: { nodes, tableId },
    });
  };
  const updateTableSelected = (value) => {
    if (state.tableSelected !== value) {
      dispatch({
        type: "UPDATE_TABLE_SELECTED",
        value,
      });
      if (value?.value) {
        getNodes(value.value);
      }
    }
  };

  const updateColumnSelected = (value) => {
    if (state.columnSelected !== value) {
      dispatch({
        type: "UPDATE_ATTRIBUTE",
        field: "columnSelected",
        value: value,
      });
    }
  };

  // Fetches a list of tables in the database
  const getTables = () => {
    dispatch({
      type: "UPDATE_ATTRIBUTE",
      field: "loading",
      value: true,
    });
    api
      .get("/apps/editor/controllers/ops", {
        params: {
          subdomain: appid,
          db_id,
        },
        signal: getTablesController.signal,
      })
      .then((res) => {
        updateTableOptions(res.data.data);
      })
      .catch((err) => {
        console.error(err);
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove("session");
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(
              `/auth/login?redirect=/apps/${appid}/security`
            );
          } else if (err.response.status === 400) {
            toast.error("Error 400 | Bad Request");
          } else if (err.response.status === 404) {
            toast.error("Error 404 | Not Found");
          } else if (err.response.status === 500) {
            toast.error("Error 500 | Internal Server Error");
          }
        }
      });
  };

  // Fetches a list of columns   of selected table
  const getNodes = async (tableId) => {
    if( state.nodesHash[tableId ]){ 
      dispatch({
        type: "UPDATE_NODES",
        value: { nodes : state.nodesHash[tableId ], tableId },
      });
    }
    else { 
      api
      .get("/apps/editor/controllers/nodes", {
        params: {
          db_id: db_id,
          id: tableId,
          qm: "select",
          subdomain: appid,
        },
        signal: getNodesController.signal,
      })
      .then((res) => {
        updateNodes(res.data.data.nodes, tableId);
      })
      .catch((err) => {
        console.error(err);
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove("session");
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(
              `/auth/login?redirect=/apps/${appid}/security`
            );
          } else if (err.response.status === 400) {
            toast.error("Error 400 | Bad Request");
          } else if (err.response.status === 404) {
            toast.error("Error 404 | Not Found");
          } else if (err.response.status === 500) {
            toast.error("Error 500 | Internal Server Error");
          }
        }
      });
    }

  };

  const saveParamMap = () => {
    const customObject = {
      ...sessionKeyValues,
    };

    if( selectedRow ){ 
      delete customObject[selectedRow.column_id ]
    }

    customObject[state.columnSelected.value] =  {
      column_id: state.columnSelected.value,
      param_key: state.paramKey,
      column_name: `${state.tableSelected.tableName}.${state.columnSelected.label}`,
      created_at: Date.now() / 1000,
    }

    dispatch({
      type: "UPDATE_ATTRIBUTE",
      field: "loading",
      value: true,
    });

    updateParamMap(customObject,()=>{
      dispatch({
        type: "UPDATE_ATTRIBUTE",
        field: "loading",
        value: false,
      });
      modalHandler();
    } )

   
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
            <Input
              //   autoFocus={selectedRow ? true : false}
              className="database-modal-enum-body-toolbar-field-input"
              onChange={updateAttribue}
              placeholder="Param Key"
              name="paramKey"
              value={state.paramKey}
            />
          </div>
          <div className="database-modal-enum-body-toolbar-field">
            <CustomSelect
              autoFocus={true}
              classNamePrefix="react-select"
              defaultMenuIsOpen={true}
              noOptionsMessage={() => "No tables match the search term"}
              onChange={(value) => updateTableSelected(value)}
              options={state.tableOptions}
              placeholder="Select Table"
              value={state.tableSelected}
              isClearable="true"
            />
          </div>
          <div className="database-modal-enum-body-toolbar-field">
            <CustomSelect
              autoFocus={state.tableSelected ? true : false}
              classNamePrefix="react-select"
              //   defaultMenuIsOpen={state.tableSelected ? true : false}
              noOptionsMessage={() => "No Column match the search term"}
              onChange={(value) => updateColumnSelected(value)}
              options={state.columnsList}
              placeholder="Select Column"
              value={state.columnSelected}
              isClearable="true"
            />
          </div>
        </div>
      );
    }
  };

  return (
    <Modal
      className="database-modal-enum"
      isOpen={modalState}
      toggle={modalHandler}
    >
      <ModalHeader className="modal-header clearfix">
        <div className="float-left">Create Params Map</div>
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
        <div className="dashboard-modal-share-buttons" style={{display : 'flex' , width:'100%'}}>
          <div className="dashboard-modal-share-button" style={{width: "100%" ,paddingRight: '7px'}}>
            <Button block color="falcon-danger" onClick={closeModal}>
              Close &nbsp;
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </div>
          <div className="dashboard-modal-share-button" style={{width: "100%" ,paddingLeft: '7px'}}>
            <Button
            style={{width: "100%"}}
              color="falcon-success"
              disabled={
                !(
                  state.tableSelected &&
                  state.paramKey?.trim() &&
                  state.columnSelected
                ) || state.loading
              }
              onClick={saveParamMap}
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

export default CreateModal;
