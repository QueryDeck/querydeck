// React imports
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch } from 'react-redux'

// Library imports
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  Label,
  Input,
  ModalFooter,
} from "reactstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { Spinner } from "reactstrap";
import api from "../../../../api";

// Components
let getTablesController;
let getNodesController;

const SetupAuthModal = (props) => {
  const {
    toggleModalState,
    modalState,
    secretHandler,
    secret,
    // authHeaderName,
    // authorizationTokenHandler,

    algorithmList,
    algorithmHandler,
    alogorithm,
    enableAuth,
    updateAuth,
    auth,

    roleSessionKey,
    userSessionKey,
    selectedTable,
    selectedColumn,

    userRoleHandler,
    userSessionKeyHandler,
    tableHandler,
    columnHandler,

    appid,
    db_id,
  } = props;

  // Redux
  const reduxDispatch = useDispatch()

  const history = useHistory();

  const [tableOptions, setTableOptions] = useState(null);
  const [columnOptions, setColumnOptions] = useState(null);

  useEffect(() => {
    getTablesController = new AbortController();
    getNodesController = new AbortController();

    // getTables();
    // if (selectedRow) {
    //   getNodes(selectedRow.column_id.split(".").shift());
    //   dispatch({
    //     type: "FILL_SELECTED_DATA",
    //     selectedRow: selectedRow,
    //   });
    // }

    return () => {
      getTablesController.abort();
      getNodesController.abort();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (modalState) {
      if (db_id && !tableOptions) {
        getTables();
      }
      else if (db_id && tableOptions) {
        setData()
      }
    }

    // eslint-disable-next-line
  }, [modalState]);

  useEffect(() => {
    if (modalState) {
 

      if (tableOptions) {
  
        setData()
      }
    }

    // eslint-disable-next-line
  }, [tableOptions]);

  
  const setData = ( ) => {
    // set loaded database data
    if(auth && auth.user_id_column_id  ){ 

    let tableId = auth.user_id_column_id.split(".")[0]
    let selectedTable
    tableOptions.forEach((tableData)=>{
      let currSelected =  tableData.options.find((item) => item.value === tableId)
      if(currSelected){ 
        selectedTable = currSelected; 
      }
    })
     
    tableHandler(selectedTable);
    columnHandler( {label:  auth.user_id_column_name || ""  , value : auth.user_id_column_id || ""} || {}  )
    
    getNodes( tableId)
  }

  };


  ///// Network requests /////
  const catchError = (error) => {
    if (error.response) {
      if (error.response.data.meta.status === 403) {
        Cookies.remove("session");
        toast.warning(`Please login again`);
        reduxDispatch({ type: "RESET" });
        history.push(
          `/auth/login?redirect=/apps/${appid}/security/authentication`
        );
      } else if (error.response.data.meta.status === 400) {
        toast.error("Error 400 | Bad Request");
      } else if (error.response.data.meta.status === 404) {
        toast.error("Error 404 | Not Found");
      } else if (error.response.data.meta.status === 500) {
        toast.error("Error 500 | Internal Server Error");
      } else {
        toast.error("Something went wrong");
      }
    } else {
      console.error(error);
    }
  };

  // Fetches a list of tables in the database
  const getTables = async () => {
    try {
      // updateAttribute("loading", true);
      const response = await api.get("/apps/editor/controllers/ops", {
        params: {
          subdomain: appid,
          db_id,
        },
        signal: getTablesController.signal,
      });
      // setTableOptions(response.data.data )
      let tableOptions = [];
      let tablesHash = {};
      response.data.data.tables.forEach((element) => {
        // Adds tables to the hashed array of schemas
        if (tablesHash[element.text.split(".")[0]]) {
          let schema = tablesHash[element.text.split(".")[0]];
          schema.push({
            tableName: element.text,
            value: element.id,
            label: element.text
              .split(".")
              .splice(1, element.text.split(".").length - 1)
              .join(""),
          });
          tablesHash[element.text.split(".")[0]] = schema;
          // Creates a new hashed array for a schema, to populate it with tables
        } else {
          tablesHash[element.text.split(".")[0]] = [
            {
              tableName: element.text,
              value: element.id,
              label: element.text
                .split(".")
                .splice(1, element.text.split(".").length - 1)
                .join(""),
            },
          ];
        }
      });
      // Pushes schemas with their tables into separate categories
      const schemas = Object.keys(tablesHash);
      schemas.forEach((element) => {
        tableOptions.push({
          label: element,
          options: tablesHash[element],
        });
      });

      setTableOptions(tableOptions);
    } catch (error) {
      catchError(error);
    }
  };

  // Fetches a list of columns   of selected table
  const getNodes = async (tableId) => {
    try {
      // updateAttribute("loading", true);
      const response = await api.get("/apps/editor/controllers/nodes", {
        params: {
          subdomain: appid,
          db_id,
          qm: "select",
          id: tableId,
        },
        signal: getNodesController.signal,
      });
      // setTableOptions(response.data.data )
      const columnsList = [];
      response.data.data.nodes.forEach((element) => {
        columnsList.push({
          value: element.id,
          label: element.text,
        });
      });

      setColumnOptions(columnsList);
    } catch (error) {
      catchError(error);
    }
  };
 

  const updateTableSelected = (value) => {
    tableHandler(value);
    columnHandler(null);
    setColumnOptions(null);
    if (value?.value) {
      getNodes(value.value);
    }
  };

 

  const renderModalBody = () => {
    if (!tableOptions) {
      return (
        <div className="loading-div">
          <Spinner className="loading-spinner" color="primary" type="grow" />
        </div>
      );
    } else {
      return (
        <div
          style={{
            padding: "0px 10px 20px 10px",
          }}
        >
          <Label className="list-card-label security-auth-dropdown-bx">
            Algorithm
            <Select
              autoFocus
              classNamePrefix="react-select"
              hideSelectedOptions
              noOptionsMessage={() => "No Algorithm match the search term"}
              onChange={algorithmHandler}
              options={algorithmList}
              placeholder="Select Algorithm"
              value={alogorithm}
            />
          </Label>
          <br />
          <Label className="list-card-label">
            { alogorithm && alogorithm?.value.startsWith('RS') ? 'JWT Public Key':  'JWT Secret Key'}
            <Input
              className="list-card-textarea"
              placeholder={alogorithm && alogorithm?.value.startsWith('RS') ?"Enter JWT public key here" : "Enter secret key here"}
              type="textarea"
              onChange={secretHandler}
              value={secret}
            />
          </Label>
          <br />

          <Label className="list-card-label">
            User Session Key
            <Input
              placeholder={"Enter user session key  "}
              type="text"
              onChange={userSessionKeyHandler}
              value={userSessionKey}
            />
          </Label>
     
          <div className="list-card-label security-auth-dropdown-bx">
            <span style={{ fontSize: "14px", fontWeight: 500 }}>
              {" "}
              User Session Column{" "}
            </span>

            <div className="database-modal-enum-body-toolbar">
              <div className="database-modal-enum-body-toolbar-field">
                <Select
                  // autoFocus={true}
                  classNamePrefix="react-select"
                  // defaultMenuIsOpen={true}
                  noOptionsMessage={() => "No tables match the search term"}
                  onChange={(value) => updateTableSelected(value)}
                  options={tableOptions || []}
                  placeholder="Select Table"
                  value={selectedTable}
                  isClearable="true"
                />
              </div>
              <div className="database-modal-enum-body-toolbar-field">
                <Select
                  // autoFocus={state.tableSelected ? true : false}
                  classNamePrefix="react-select"
                  //   defaultMenuIsOpen={state.tableSelected ? true : false}
                  noOptionsMessage={() =>{ 
                   if(!selectedTable) return "Select a Table first"
                   return  !columnOptions
                    ? "loading..."
                    : "No Column match the search term"
                  }
                  
                  }
                  onChange={(value) => columnHandler(value)}
                  options={columnOptions || []}
                  placeholder="Select Column"
                  value={selectedColumn}
                  isClearable="true"
                />
              </div>
            </div>
          </div>
          <Label className="list-card-label">
            Role Session Key
            <Input
              placeholder={"Enter role session key "}
              type="text"
              onChange={userRoleHandler}
              value={roleSessionKey}
            />
          </Label>
          {/* <Label className="list-card-label">
            Authorization Header Token Name (Optional)
            <Input
              placeholder={"Enter authorization header token name  "}
              type="text"
              onChange={authorizationTokenHandler}
              value={authHeaderName}
            />
          </Label> */}
        </div>
      );
    }
  };

  return (
    <Modal
      className="query-modal-columns"
      isOpen={modalState}
      toggle={toggleModalState}
      style={{ top: "5%" }}
    >
      <ModalHeader className="modal-header clearfix">
        <div className="float-left">Setup Authentication</div>
        <Button
          className="float-right"
          color="falcon-danger"
          onClick={toggleModalState}
          size="sm"
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </ModalHeader>
      <ModalBody className="query-modal-columns-body">
        {renderModalBody()}
      </ModalBody>
      <ModalFooter>
        <div className="query-modal-columns-vanilla-footer">
          <Button block color="falcon-danger" onClick={toggleModalState}>
            Close &nbsp;
            <FontAwesomeIcon icon={faTimes} />
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            block
            color="falcon-success"
            onClick={auth? updateAuth : enableAuth}
            disabled={!Boolean(secret.length) || !Boolean(alogorithm) || !Boolean(roleSessionKey.length) || !Boolean(userSessionKey.length)|| !Boolean(selectedColumn) || !Boolean(selectedTable) }
          >
            { auth ?<>   Update &nbsp;   <FontAwesomeIcon icon={faSave} /></> :  <>   Save &nbsp;   <FontAwesomeIcon icon={faSave} /></> }
         
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default SetupAuthModal;
