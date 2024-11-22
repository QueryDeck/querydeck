// React imports
import React, { useEffect, useReducer } from "react";
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch } from 'react-redux'

// Library imports
import { Box } from "@mui/material";

import AuthorizationPermission from "./AuthorizationPermission";
import AuthorizationList from "./AuthorizationList";
// API
import api from "../../../../api";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { Spinner } from "reactstrap";

import authorizationReducer from "../../../reducers/security/authorization/authorizationReducer";

// Abort controller for cancelling network requests
let databasesController;
let createRoleController;
let getRolesController;

const Authorization = (props) => {
  // // Props
  const { appid, currSelectedTab } = props;

  // Initial state
  const initialState = {
    loading: true,
    rolesData: [],
    roleTypeOptions: [],
    createRoleModalState: false,
    authDetails: {
      authDetailId: "",
      appAuth: {},
    },
    dbId: null,
  };

  // Redux
  const reduxDispatch = useDispatch()

  // // For 403 errors on unauthorised users
  const history = useHistory();

  const [state, dispatch] = useReducer(authorizationReducer, initialState);

  useEffect(() => {
    getRolesController = new AbortController();
    createRoleController = new AbortController();
    databasesController = new AbortController();
    getDatabases();
    // getRoles();
    return () => {
      getRolesController.abort();
      createRoleController.abort();
      databasesController.abort();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (currSelectedTab === "authorization") {
      getRoles();
    }

    // eslint-disable-next-line
  }, [currSelectedTab]);

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
        reduxDispatch({ type: "RESET" });
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

  // Fetches a list of Roles
  const getRoles = async () => {
    updateAttribute("loading", true);
    try {
      const response = await api.get("/apps/editor/controllers/auth", {
        params: {
          subdomain: appid,
        },
        signal: getRolesController.signal,
      });

      dispatch({
        type: "SET_ROLES",
        data: response.data.data,
      });
    } catch (error) {
      catchError(error);
    }
  };

  // create or update  a   Roles
  const createRole = async (roleObj, callBack) => {
    try {
      updateAttribute("loading", true);
      await api.post(
        "/apps/editor/controllers/auth/role",
        {
          subdomain: appid,
          auth_detail_id: state.authDetails.authDetailId,
          name: roleObj.roleName,
          role_value: roleObj.roleValue,
          custom_permissions: roleObj.customPermissions || {},
          role_type_id: roleObj.roleType,
        },
        {
          signal: createRoleController.signal,
        }
      );
      toast.success("Created Successfully");
      callBack && callBack();
      getRoles();
    } catch (error) {
      catchError(error);
    }
  };

  const getDatabases = async () => {
    updateAttribute("loading", true);
    try {
      const response = await api.get("/databases", {
        params: {
          subdomain: appid,
        },
        signal: databasesController.signal,
      });

      dispatch({
        type: "SET_DB_ID",
        db_id: response.data.data.databases[0].db_id,
      });
    } catch (error) {
      catchError(error);
    }
  };

  const renderData = () => {
    if (!state.dbId || (state.loading && !props.roleId)) {
      return (
        <div className="loading-div">
          <Spinner className="loading-spinner" color="primary" type="grow" />
        </div>
      );
    } else if (props.roleId) {
      return (
        <AuthorizationPermission
          appid={props.appid}
          db_id={state.dbId}
          roleId={props.roleId}
          rolesData={state.rolesData}
          authDetails={state.authDetails}
          getRoles={getRoles}
          createRole={createRole}
        />
      );
    } else {
      return (
        <AuthorizationList
          appid={props.appid}
          db_id={state.dbId}
          authParentState={state}
          getRoles={getRoles}
          createRole={createRole}
        />
      );
    }
  };
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
      {renderData()}
    </Box>
  );
};

export default Authorization;
