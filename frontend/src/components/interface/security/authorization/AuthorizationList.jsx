// React imports
import React, { useEffect, useReducer, useRef } from "react";
import { useHistory } from "react-router-dom";

// Reducers
import authorizationPermissionListReducer from "../../../reducers/security/authorization/authorizationPermissionListReducer";

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
import { Badge, Button, ButtonGroup, Input, Spinner } from "reactstrap";
import { toast } from "react-toastify";

import timeCalculator from "../../../../timeCalculator";
import CreateRoleModal from "./modal/CreateRoleModal";

// Abort controllers for cancelling network requests
let deleteParamMapController;
let createRoleController;
let getRolesController;
// Database custom column section after selecting a database
const AuthorizationList = (props) => {
  // Props
  const { appid, authParentState, createRole } = props;

  // For 403 errors on unauthorised users
  let history = useHistory();

  // Initial state
  const initialState = {
    loading: true,
    tableData: [],
    roleTypeOptions: [],
    createRoleModalState: false,
    authDetails: {},

    filterText: "",
    selectedRow: null,
    sorting: {
      field: "Creation",
      order: true, // True: Ascending | False: Descending
    },
    tooltips: {
      create: false,
    },
    roleList: [],
  };
  const timeoutIDs = useRef([]);

  const [state, dispatch] = useReducer(
    authorizationPermissionListReducer,
    initialState
  );

  useEffect(() => {
    deleteParamMapController = new AbortController();
    getRolesController = new AbortController();
    createRoleController = new AbortController();

    return () => {
      deleteParamMapController.abort();
      getRolesController.abort();
      createRoleController.abort();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    dispatch({
      type: "UPDATE_ROLES",
      authParentState,
    });
  }, [authParentState?.rolesData]);

  const updateAttribute = (field, value) => {
    dispatch({
      type: "UPDATE_ATTRIBUTE",
      field: field,
      value: value,
    });
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
    state.roleList.forEach((item) => {
      if (
        item.name.toLowerCase().includes(lowerCaseVal) ||
        item.type.toLowerCase().includes(lowerCaseVal)
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

  const handleCreateRole = async (roleObj) => {

    if (!state.selectedRow && state.tableData.find((item) => item.name.toLowerCase().trim() === roleObj.roleName.toLowerCase().trim())) {
      toast.warn(`Role '${roleObj.roleName}' Already Exists.`);
      return;
    }

    updateAttribute("loading", true);
    createRole(roleObj, () => {
      closeModal();
    });
  };

  const openModal = () => {
    updateAttribute("createRoleModalState", true);
  };

  const closeModal = () => {
    updateAttribute("createRoleModalState", false);
    updateAttribute("selectedRow", null);
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
          ? state.tableData.sort((a, b) => b?.created_at - a?.created_at)
          : state.tableData.sort((a, b) => a?.created_at - b?.created_at),
      });
    } else if (state.sorting.field === "Creation") {
      dispatch({
        type: "CYCLE_FIELD",
        field: "Name",
        tableData: state.sorting.order
          ? state.tableData.sort((a, b) => a.name.localeCompare(b.name))
          : state.tableData.sort((a, b) => b.name.localeCompare(a.name)),
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
            onClick={openModal}
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
      <div className="enums-list-enum" key={rowObj.role_id} title={rowObj.name}>
        <div
          className="enums-list-enum-name"
          style={{ cursor: rowObj.type === "Admin" ? "default" : "pointer" }}
          onClick={() => {
            if (rowObj.type === "Admin") {
              toast.warn(
                "Role 'Admin' cannot be coustomized. For custom access please use 'custom' role type"
              );
              return;
            }
            history.push(`/apps/${appid}/security/roles/${rowObj.role_id}?tab=authorization`);
          }}
        >
          <div className="enums-list-enum-name-text">
            {getModifiedTitle(rowObj)}
            <Badge>{rowObj.role_value}</Badge>
            <Badge style={{backgroundColor: rowObj.type === 'Custom'? 'rgb(39 129 67 / 47%)' :'rgb(130 57 57 / 47%)' }}>{rowObj.type}</Badge>
          </div>
          <div className="enums-list-enum-name-creation">
            <Badge>{timeCalculator(rowObj.created_at)}</Badge>
          </div>
        </div>
        <div className="enums-list-enum-action">
          <Button
            color="falcon-danger"
            onClick={() => toggleModal("createRoleModalState", true, rowObj)}
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
    if (state.roleList.length) {
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
          onClick={openModal}
        >
          Click to create Roles
        </div>
      );
    }
  };

  const renderList = () => {
    
   
  if (state.roleTypeOptions?.length === 0) {
        return (
          <div
            className="enums-list-enum enums-list-enum-create-disabled enums-list-enum-empty"
            key="notset"
          >
            Please setup Authentication to create Roles and Permissions
          </div>
        );
    
  }else { 
    const tableData = state.tableData;

    let elementBody = [];
    elementBody.push(renderToolbar());
    const elementList = [];
    if (state.tableData.length) {
      tableData.forEach((item) => {
        elementList.push(createRowElement(item));
      });
      elementBody.push(<div key="saved">{elementList}</div>);
    } else {
      elementBody.push(renderEmpty());
    }
    return elementBody;
  }
   
  }

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
          {renderList()}
          <CreateRoleModal
            closeModal={closeModal}
            openModal={openModal}
            modalState={state.createRoleModalState}
            roleTypeOptions={state.roleTypeOptions}
            createRole={handleCreateRole}
            selectedRow={state.selectedRow}
          />
        </>
      );
    }
  };

  return <div>{renderData()}</div>;
};

const getModifiedTitle = (rowObj) => {
  if (rowObj.name) return rowObj.name;
  let title = rowObj.name?.slice(0, 40) || "";

  return title;
};

export default AuthorizationList;
