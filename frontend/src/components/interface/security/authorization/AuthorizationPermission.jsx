// React imports
import React, { useEffect, useReducer } from "react";
import { useHistory, NavLink } from "react-router-dom";

// Redux
import { useDispatch } from 'react-redux'

// Library imports
import { Box } from "@mui/material";

import { Table, BreadcrumbItem, Breadcrumb } from "reactstrap";

import { styled } from "@mui/material/styles";

// API
import api from "../../../../api";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

import styles from "./style.modules.scss";

import { Button } from "reactstrap";
import AddTablePermissionModal from "./modal/AddTablePermissionModal";
import EditTablePermissionModal from "./modal/EditTablePermissionModal";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import authorizationRoleReducer from "../../../reducers/security/authorization/authorizationRoleReducer";
import PermissionTableRow from "./PermissionTableRow";

const Div = styled("div")(({ theme }) => ({
  ...theme.typography.button,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1),
  textTransform: "capitalize",
  color: "black",
  // fontSize: 15,
  // textAlign: 'center'
}));

// Abort controller for cancelling network requests
let getNodesController;
let getTablesController;
let getJoinGraphsController;
// Authentication section at '/apps/app-id/authentication
const AuthorizationPermission = (props) => {
  // // Props
  const { appid, db_id, rolesData, createRole, authDetails } = props;

  // Redux
  const reduxDispatch = useDispatch()

  // // For 403 errors on unauthorised users
  const history = useHistory();

  const initialState = {
    addTableModalState: false,
    editTableModalState: false,
    rolesData: [],
    authDetails: {
      authDetailId: "",
      appAuth: null,
    },
    selectedRole: null,
    selectedPermisson: {
      tableName: null,
      cellDetail: null,
      method: null, // "select", "insert", "update", "delete"
    },

    loading: true,
    tableOptions: [],
    filterFields: null, //table columns
    operators: [],
    deleteModalState: false,
    editModalState: false,

    selectedRow: null,
    joinGraphs: null,
  };

  const [state, dispatch] = useReducer(authorizationRoleReducer, initialState);

  useEffect(() => {
    getNodesController = new AbortController();
    getTablesController = new AbortController();
    getJoinGraphsController = new AbortController();

    // getRoles();
    getTables();

    return () => {
      getNodesController.abort();
      getTablesController.abort();
      getJoinGraphsController.abort();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (rolesData) {
      const currRole = rolesData.find((item) => item.role_id === props.roleId);

      if (currRole && currRole.custom_permissions) {
        dispatch({
          type: "UPDATE_SELECTED_ROLE",
          selectedRole: currRole,
          authDetails,
        });
      }
    }
  }, [rolesData]);

  const updateAttribute = (field, value) => {
    dispatch({
      type: "UPDATE_ATTRIBUTE",
      field: field,
      value: value,
    });
  };

  ///// Network requests /////
  const catchError = (error) => {
    if (error.response) {
      if (error.response.data.meta.status === 403) {
        Cookies.remove("session");
        toast.warning(`Please login again`);
        reduxDispatch({ type: 'RESET' });
        history.push(`/auth/login?redirect=/apps/${appid}/security`);
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
      updateAttribute("loading", true);
      const response = await api.get("/apps/editor/controllers/ops", {
        params: {
          subdomain: appid,
          db_id,
        },
        signal: getTablesController.signal,
      });

      dispatch({
        type: "UPDATE_TABLE_OPTIONS",
        data: response.data.data,
      });
    } catch (error) {
      catchError(error);
    }
  };

  // Nodes List
  const getNodes = async (node) => {
    try {
      const response = await api.post(
        "/apps/editor/controllers/where-cols",
        {
          db_id,
          agg_paths: [],
          c: [{ id: `${node}.1` }],
          qm: "select",
          subdomain: appid,
        },
        {
          signal: getNodesController.signal,
        }
      );
      const data = response.data.data;

      dispatch({
        type: "SET_FILTER_FIELDS",
        payload: {
          data,
          appAuth: state?.authDetails?.appAuth || {}
        },
      });
    } catch (error) {
      catchError(error);
    }
  };

  // Join graphs
  const getJoinGraphs = async (node) => {
    try {
      const response = await api.get("/apps/editor/join-graph", {
        params: {
          subdomain: appid,
          id: node,
          db_id,
        },
        signal: getJoinGraphsController.signal,
      });
      updateAttribute("joinGraphs", response.data.data);
    } catch (error) {
      catchError(error);
    }
  };

  const toggleAddTablePermissionModal = () => {
    updateAttribute("addTableModalState", !state.addTableModalState);
  };

  const toggleEditTablePermissionModal = () => {
    updateAttribute("editTableModalState", !state.editTableModalState);
  };

  const addTableToPermission = async (selectedTable) => {
    if (state.selectedRole.custom_permissions[selectedTable.tableName]) {
      toast.warn(`Table '${selectedTable.tableName}' Already Added.`);
      return;
    }
    createRole(
      {
        roleName: state.selectedRole.name,
        roleType: state.selectedRole.role_type_id,
        roleValue:  state.selectedRole.role_value,
        customPermissions: {
          ...state.selectedRole.custom_permissions,
          [`${selectedTable.tableName}`]: {
            delete: {
              access_type: -1,
            },
            insert: {
              access_type: -1,
            },
            select: {
              access_type: -1,
            },
            update: {
              access_type: -1,
            },
          },
        },
      },
      () => {
        toggleAddTablePermissionModal();
      }
    );
  };

  const handleTableCellClick = (cellDetail, tableName, method) => {
    if (state.tableOptions?.length) {
      let currTable;
      state.tableOptions.forEach((item) => {
        item.options.forEach((tableData) => {
          if (tableData.tableName === tableName) {
            currTable = tableData;
          }
        });
      });

      if (currTable) {
        getNodes(currTable.value);
        getJoinGraphs(currTable.value);
        dispatch({
          type: "SET_SELECTED_PERMISSION",

          selectedPermisson: {
            tableName,
            method,
            cellDetail,
          },
        });
      }
    }

    toggleEditTablePermissionModal();
  };

  const handleUpdateRole = async ({ filters, accessTypeValue }) => {
    // return ;
    // updateAttribute("loading", true);
    const selectedPermisson = state.selectedPermisson;
    const roleObj = {
      roleName: state.selectedRole.name,
      roleType: state.selectedRole.role_type_id,
      roleValue: state.selectedRole.role_value,
      customPermissions: {
        ...state.selectedRole.custom_permissions,
        [`${selectedPermisson.tableName}`]: {
          ...state.selectedRole.custom_permissions[selectedPermisson.tableName],
          [selectedPermisson.method]: {
            access_type: accessTypeValue,
            conditions: filters,
          },
        },
      },
    };

    createRole(roleObj, () => {
      toggleEditTablePermissionModal();
    });
  };

  if (!authDetails || !authDetails.authDetailId) return null;
  return (
    <Box
      className="data-src-table-bx"
      sx={{
        height: "calc(100vh - 226px)",
        paddingRight: "4px",
        overflow: "auto",
      }}
      dir="ltr"
    >
      <span
        style={{
          display: "inline-block",
          position: "absolute",
          top: "34px",
          left: "20px",
        }}
      >
        <Breadcrumb listtag="div">
          <BreadcrumbItem>
            <NavLink
              to={`/apps/${appid}/security/cors`}
              style={{ textDecoration: "none" }}
            >
              Security
            </NavLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <NavLink
              to={`/apps/${appid}/security/roles`}
              style={{ textDecoration: "none" }}
            >
              Roles
            </NavLink>
          </BreadcrumbItem>
          <BreadcrumbItem active>{state?.selectedRole?.name}</BreadcrumbItem>
        </Breadcrumb>
        {/* <Button
          // className="menu-btn menu-btn-apps"
          color="falcon-primary"
          id="roles_back"
          style={{ boxShadow: "initial" }}
          onClick={() => history.push(`/apps/${appid}/security`)}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> <span> Back to Roles </span>
        </Button> */}
      </span>
      <div
        className={styles.name}
        style={{
          border: "1px solid #e1e1e1",
          borderRadius: "3px",
          padding: "0px 10px 0px 10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Div>{`Permissions |  ${state?.selectedRole?.name}  `}</Div>
          <Button
            color="falcon-success"
            style={{ margin: "6px 2px", padding: "2px 10px" }}
            onClick={toggleAddTablePermissionModal}
          >
            <FontAwesomeIcon icon={faPlus} />
          </Button>
        </div>

        {/* <hr style={{ margin: "0px 0px 10px 0px" }} /> */}

        <Table bordered style={{ textAlign: "center" }}>
          <thead style={{ color: "#000000b8", backgroundColor: "#fff5f5" }}>
            <tr>
              <th>Role</th>
              <th>Select</th>
              <th>Insert</th>
              <th>Update</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {state?.selectedRole?.custom_permissions &&
              Object.keys(state.selectedRole.custom_permissions).map(
                (key, index) => {
                  const tablePermission =
                    state.selectedRole.custom_permissions[key];

                  return (
                    <PermissionTableRow
                      key={index}
                      tableName={key}
                      tablePermission={tablePermission}
                      handleTableCellClick={handleTableCellClick}
                    />
                  );
                }
              )}
          </tbody>
        </Table>
      </div>
      <AddTablePermissionModal
        modalState={state.addTableModalState}
        state={state}
        closeModal={toggleAddTablePermissionModal}
        addTableToPermission={addTableToPermission}
      />
      <EditTablePermissionModal
        modalState={state.editTableModalState}
        state={state}
        closeModal={toggleEditTablePermissionModal}
        db_id={db_id}
        subdomain={appid}
        updateRole={handleUpdateRole}
        catchError={catchError}
      />
    </Box>
  );
};

export default AuthorizationPermission;
