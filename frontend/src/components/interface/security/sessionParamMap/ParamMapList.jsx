// React imports
import React, { useEffect, useReducer, useRef } from "react";
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch } from 'react-redux'

// Reducers
import paramMapListReducer from "../../../reducers/security/paramMap/paramMapListReducer";

// Library imports
import {
  faPlus,
  faSortAlphaUp,
  faSortAlphaDown,
  faSortNumericUp,
  faSortNumericDown,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Cookies from "js-cookie";
import {
  Badge,
  Button,
  ButtonGroup,
  Input,
  Spinner,
} from "reactstrap";
import { toast } from "react-toastify";

// Components
import CreateModal from "./CreateModal";
import DeleteModal from "./DeleteModal";
import timeCalculator from "../../../../timeCalculator";

// API
import api from "../../../../api";

// Abort controllers for cancelling network requests
let deleteParamMapController;
let saveParamMapController;
let getParamMapController;

// Database custom column section after selecting a database
const ParamMapList = (props) => {
  // Redux
  const reduxDispatch = useDispatch()

  // Props
  const { appid, db_id, sessionKeyValues, getAuth } = props;

  // For 403 errors on unauthorised users
  let history = useHistory();

  // Initial state
  const initialState = {
    createModalState: false,
    deleteModalState: false,
    editModalState: false,
    filterText: "",
    selectedRow: null,
    sorting: {
      field: "Creation",
      order: true, // True: Ascending | False: Descending
    },
    loading: true,
    tooltips: {
      create: false,
    },
    tableData: [] , 
    sessionKeyValueslist:  []  , 
  };
  const timeoutIDs = useRef([]);

  const [state, dispatch] = useReducer(paramMapListReducer, initialState);

  useEffect(() => {
    deleteParamMapController = new AbortController();
    getParamMapController = new AbortController();
    saveParamMapController = new AbortController();

    return () => {
      deleteParamMapController.abort();
      getParamMapController.abort();
      saveParamMapController.abort();
    };
    // eslint-disable-next-line
  }, []);


  useEffect (()=>{
    
     const sessionKeyValueslist =  formatSessionKeyValues(sessionKeyValues);
     dispatch({
      type: "SET_PARAM_MAP",
      sessionKeyValueslist
    });
  }, [sessionKeyValues ])
 

  const formatSessionKeyValues = (sessionKeyValuesData) => {
    if (sessionKeyValuesData) {
      return Object.values(sessionKeyValuesData);
    }

    return [];
  };

  // Toggles modal
  const toggleModal = (field, value, selectedRow = null) => {
    dispatch({
      type: "TOGGLE_MODAL",
      field,
      selectedRow,
      value,
    });
  };

  // Filters apps according to text in searchbox
  const filterItems = (val) => {
    const lowerCaseVal = val.toLowerCase();
    const updatedData = [];
    state.sessionKeyValueslist.forEach((item) => {

      if (
        item.column_name.toLowerCase().includes(lowerCaseVal) ||
        item.param_key.toLowerCase().includes(lowerCaseVal)
      ) {
        updatedData.push(item);
      }
    });
    dispatch({
      type: "SINGLE",
      field: "tableData",
      payload: updatedData,
    });
  };

  // Updates text in searchbox
  const updateFilter = (event) => {
    dispatch({
      type: "SINGLE",
      field: "filterText",
      payload: event.target.value,
    });
    filterItems(event.target.value);
  };

  // Renders create custom column modal
  const renderCreateModal = () => {
    if (state.createModalState) {
      return (
        <CreateModal
          db_id={db_id}
          appid={appid}
          sessionKeyValues={sessionKeyValues}
          getAuth={getAuth}
          updateParamMap={updateParamMap}
          modalHandler={() => toggleModal("createModalState", false)}
          modalState={state.createModalState}
   
        />
      );
    } else if (state.editModalState) {
      return (
        <CreateModal
          db_id={db_id}
          appid={appid}
          sessionKeyValues={sessionKeyValues}
          getAuth={getAuth}
          updateParamMap={updateParamMap}
          modalHandler={() => toggleModal("editModalState", false)}
          modalState={state.editModalState}
          selectedRow={state.selectedRow}

        />
      );
    } else {
      return "";
    }
  };

  // Renders delete custom column modal
  const renderDeleteModal = () => {
    if (state.selectedRow) {
      return (
        <DeleteModal
          modalState={state.deleteModalState}
          selectedObj={{
            ...state.selectedRow,
            label: getModifiedTitle(state.selectedRow),
          }}
          deleteObj={removeParamMap}
          modalHandler={() => toggleModal("deleteModalState", false)}
        />
      );
    } else {
      return "";
    }
  };

 
 
  const updateParamMap = (customObject, callBack) => {
    api
      .put(
        "/apps/editor/controllers/param-map",
        {
          subdomain: appid,
          session_key_values: customObject,
        },
        {
          signal: saveParamMapController.signal,
        }
      )
      .then((res) => {
        callBack && callBack(res);
        getAuth();
      })
      .catch((err) => {
        console.error(err );
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove("session");
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(
             `/auth/login?redirect=/apps/${appid}/security`
            );
          } else if (err.response.status === 400) {
            toast.error(err.response?.data?.meta?.message || "Error 400 | Bad Request");
          } else if (err.response.status === 404) {
            toast.error("Error 404 | Not Found");
          } else if (err.response.status === 500) {
            toast.error("Error 500 | Internal Server Error");
          }
        }
      });
  };

  const removeParamMap = () => {
    const customObject = {
      ...sessionKeyValues,
    };

    if( state.selectedRow ){ 
      delete customObject[state.selectedRow.column_id ]

      updateParamMap(customObject )
  
    }
    
  };

  // Shows delete tooltip
  const showTooltip = (field) => {
    timeoutIDs.current.push(
      setTimeout(() => {
        dispatch({
          type: "SHOW_TOOLTIP",
          field,
        });
      }, 150)
    );
  };

  // Hides delete tooltip
  const hideTooltip = (field) => {
    timeoutIDs.current.forEach((id) => {
      clearTimeout(id);
    });
    timeoutIDs.current = [];
    dispatch({
      type: "HIDE_TOOLTIP",
      field,
    });
  };

  const cycleField = () => {
    if (state.sorting.field === "Name") {
      dispatch({
        type: "CYCLE_FIELD",
        field: "Creation",
        tableData: state.sorting.order
          ? state.tableData.sort(
             (a, b) => b?.created_at - a?.created_at
            )
          : state.tableData.sort(
            (a, b) => a?.created_at - b?.created_at
            ),
      });
    } else if (state.sorting.field === "Creation") {
      dispatch({
        type: "CYCLE_FIELD",
        field: "Name",
        tableData: state.sorting.order
          ? state.tableData.sort((a, b) =>
              a.column_name.localeCompare(b.column_name)
            )
          : state.tableData.sort((a, b) =>
              b.column_name.localeCompare(a.column_name)
            ),
      });
    }
  };

  const toggleOrder = () => {
    dispatch({
      type: "TOGGLE_ORDER",
    });
  };

  const renderOrderIcon = () => {
    if (
      state.sorting.field === "Name" ||
      state.sorting.field === "Connection"
    ) {
      if (state.sorting.order) {
        return <FontAwesomeIcon icon={faSortAlphaUp} />;
      } else {
        return <FontAwesomeIcon icon={faSortAlphaDown} />;
      }
    } else if (state.sorting.field === "Creation") {
      if (state.sorting.order) {
        return <FontAwesomeIcon icon={faSortNumericUp} />;
      } else {
        return <FontAwesomeIcon icon={faSortNumericDown} />;
      }
    }
  };


  // Renders list toolbar
  const renderToolbar = () => {
    return (
      <div className="enums-list-toolbar" key="toolbar">
        <div>
          <ButtonGroup>
            <Button color="falcon-primary" onClick={cycleField}>
              {state.sorting.field}
            </Button>
            <Button color="falcon-primary" onClick={toggleOrder}>
              {renderOrderIcon()}
            </Button>
          </ButtonGroup>
        </div>
        <div className="clearfix">
          <Input
            className="float-left enums-list-search mr-3"
            autoFocus
            onChange={updateFilter}
            placeholder={"Search "}
            type="search"
            value={state.filterText}
          />
          <Button
            color="falcon-primary"
            onClick={() => toggleModal("createModalState", true)}
            onMouseEnter={() => showTooltip("create")}
            onMouseLeave={() => hideTooltip("create")}
          >
            {state.tooltips["create"] ? <span>Add New </span> : ""}{" "}
            <FontAwesomeIcon icon={faPlus} />
          </Button>
        </div>
      </div>
    );
  };

  const createRowElement = (rowObj) => {
    return (
      <div
        className="enums-list-enum"
        key={rowObj.column_id}
        title={rowObj.column_name}
      >
        <div
          className="enums-list-enum-name"
          // onClick={() => toggleModal("queryModalState", true, rowObj)}
        >
          <div className="enums-list-enum-name-text">
            {getModifiedTitle(rowObj)}
            <Badge>{rowObj.param_key}</Badge>
          </div>
          <div className="enums-list-enum-name-creation">
            <Badge>{timeCalculator(rowObj.created_at)}</Badge>
          </div>
        </div>
        <div className="enums-list-enum-action">
          <Button
            color="falcon-danger"
            onClick={() => toggleModal("editModalState", true, rowObj)}
            onMouseEnter={() => showTooltip(rowObj.id)}
            onMouseLeave={() => hideTooltip(rowObj.id)}
          >
            {state.tooltips[rowObj.id] ? <span>Edit </span> : ""}{" "}
            <FontAwesomeIcon icon={faEdit} />
          </Button>{" "}
          &nbsp;
          <Button
            color="falcon-danger"
            onClick={() => toggleModal("deleteModalState", true, rowObj)}
            onMouseEnter={() => showTooltip(rowObj.id)}
            onMouseLeave={() => hideTooltip(rowObj.id)}
          >
            {state.tooltips[rowObj.id] ? <span>Delete</span> : ""}{" "}
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      </div>
    );
  };

  const renderEmpty = () => {
    if (state.sessionKeyValueslist.length) {
      return (
        <div
          className="enums-list-enum enums-list-enum-create-disabled enums-list-enum-empty"
          key="empty"
        >
          No match for search term
        </div>
      );
    } else {
      return (
        <div
          className="enums-list-enum enums-list-enum-create enums-list-enum-empty"
          key="empty"
          onClick={() => toggleModal("createModalState", true)}
        >
          Click to create Param Map
        </div>
      );
    }
  };

  const renderParamMapList = () => {
    const tableData = state.tableData
    
    let sessionKeyValuesBody = [];
    sessionKeyValuesBody.push(renderToolbar());
    const sessionKeyValuesElemList = [];
    if (state.tableData.length) {
      tableData.forEach((item) => {
        sessionKeyValuesElemList.push(createRowElement(item));
      });
      sessionKeyValuesBody.push(
        <div   key="saved">
          {sessionKeyValuesElemList}
        </div>
      );
    } else {
      sessionKeyValuesBody.push(renderEmpty());
    }
    return sessionKeyValuesBody;
  };

  const renderData = () => {
    if (state.loading) {
      return (
        <div className="list-deck list-deck-middle">
          <div className="loading-div ">
            <Spinner className="loading-spinner" color="primary" type="grow" />
          </div>
        </div>
      );
    } else {
      return (
        <>
          <hr />
          {renderParamMapList()}
        </>
      );
    }
  };

  return (
    <div>
      {renderCreateModal()}
      {renderDeleteModal()}
      {renderData()}
    </div>
  );
};

const getModifiedTitle = (rowObj) => {
  if (rowObj.label) return rowObj.label;
  let title = rowObj.column_name?.slice(0, 40) || "";

  return title;
};

export default ParamMapList;
