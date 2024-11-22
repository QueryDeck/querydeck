// React imports
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import Select from "react-select";

// Redux
import { useDispatch } from 'react-redux'

// Library imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faSave,
  faLockOpen,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";

import Cookies from "js-cookie";
import { Button, Input, Label, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import ParamMapList from "../sessionParamMap/ParamMapList";
import EditableTextArea from "../../../common/EditableTextArea";
import SetupAuthModal from "./SetupAuthModal";

// API
import api from "../../../../api";

// Abort controller for cancelling network requests
let getAuthController;
let enableAuthController;
let updateAuthController;
let disableAuthController;
let databasesController;

const algorithmList = [
  { value: "HS256", label: "HS256" },
  { value: "HS384", label: "HS384" },
  { value: "HS512", label: "HS512" },
  { value: "RS256", label: "RS256" },
  { value: "RS384", label: "RS384" },
  { value: "RS512", label: "RS512" },
];
// Authentication section at '/apps/app-id/authentication
const Authentication = (props) => {
  // Props
  const { appid } = props;

  // Redux
  const reduxDispatch = useDispatch()

  // For 403 errors on unauthorised users
  const history = useHistory();

  // Initial state
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [redirectURL, setRedirectURL] = useState('')
  const [secret, setSecret] = useState("");
  const [alogorithm, setAlogorithm] = useState(null);
  const [authHeaderName, setAuthHeaderName] = useState("authorization");
  const [dbId, setDbId] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [modalState, setModalState] = useState(false);
  const [roleSessionKey, setRoleSessionKey] = useState("");
  const [userSessionKey, setUsersessionkey] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  useEffect(() => {
    getAuthController = new AbortController();
    enableAuthController = new AbortController();
    updateAuthController = new AbortController();
    disableAuthController = new AbortController();
    databasesController = new AbortController();
    getAuth();
    getDatabases();
    return () => {
      getAuthController.abort();
      enableAuthController.abort();
      updateAuthController.abort();
      disableAuthController.abort();
      databasesController.abort();
    };
    // eslint-disable-next-line
  }, []);
 const setAuthData= (authData)=> { 
  setSecret(authData.client_secret);
  setAuthHeaderName(authData.token_header) ;
  // setRedirectURL(authData.redirect_url)
  setAuth(authData);
  setAlogorithm(
    algorithmList.find(
      (item) => item.value === authData.jwt_type
    ) || null
  );
  setRoleSessionKey(authData.role_session_key || "")
  setUsersessionkey(authData.user_id_session_key || "")
  setSelectedColumn( {label:  authData.user_id_column_name || ""  , value : authData.user_id_column_id || ""} || {}  )
 }
  const getAuth = () => {
    setLoading(true);
    api
      .get("/apps/editor/controllers/app-auth", {
        params: {
          subdomain: appid,
        },
        signal: getAuthController.signal,
      })
      .then((res) => {
        if (res.data.data.client_secret) {
          setAuthData(res.data.data)
          setLoading(false);
        } else {
          setAuth(null);
          setAlogorithm(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove("session");
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(`/auth/login?redirect=/apps/${appid}/security`);
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

  const enableAuth = () => {
    setButtonLoading(true);
  
    api
      .post("/apps/editor/controllers/app-auth", {
        subdomain: appid,
        client_secret: secret,
        jwt_type: alogorithm.value,
        token_header: authHeaderName,
        
        role_session_key: roleSessionKey,
        user_id_session_key: userSessionKey,
        user_id_column_id: selectedColumn?.value, 
        // redirect_url: redirectURL,
        signal: enableAuthController.signal,
      })
      .then((res) => {
        getAuth();

        // setAuth(res.data.data);
        toggleModalState()
        toast.success("Authentication Enabled");
      })
      .catch((err) => {
        console.error(err);
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove("session");
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(`/auth/login?redirect=/apps/${appid}/security`);
          } else if (err.response.status === 400) {
            toast.error("Error 400 | Bad Request");
          } else if (err.response.status === 404) {
            toast.error("Error 404 | Not Found");
          } else if (err.response.status === 500) {
            toast.error("Error 500 | Internal Server Error");
          }
        }
      })
      .finally(() => {
        setButtonLoading(false);
      });
  };

  const updateAuth = () => {
    setButtonLoading(true);
    api
      .put("/apps/editor/controllers/app-auth", {
        auth_detail_id: auth.auth_detail_id,
        subdomain: appid,
        client_secret: secret,
        jwt_type: alogorithm.value,
        token_header: authHeaderName,
        
        role_session_key: roleSessionKey,
        user_id_session_key: userSessionKey,
        user_id_column_id: selectedColumn?.value,   
        signal: updateAuthController.signal,
      })
      .then((res) => {
        // setAuth(res.data.data);
        getAuth();
        toggleModalState()
        toast.success("Authentication Updated");
      })
      .catch((err) => {
        console.error(err);
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove("session");
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(`/auth/login?redirect=/apps/${appid}/security`);
          } else if (err.response.status === 400) {
            toast.error("Error 400 | Bad Request");
          } else if (err.response.status === 404) {
            toast.error("Error 404 | Not Found");
          } else if (err.response.status === 500) {
            toast.error("Error 500 | Internal Server Error");
          }
        }
      })
      .finally(() => {
        setButtonLoading(false);
      });
  };

  const disableAuth = () => {
    setButtonLoading(true);
    api
      .delete("/apps/editor/controllers/app-auth", {
        data: {
          auth_detail_id: auth.auth_detail_id,
        },
        signal: enableAuthController.signal,
      })
      .then((res) => {
        setAuth(null);
        setSecret("");
        setAlogorithm(null);
        toast.error("Authentication Disabled");
      })
      .catch((err) => {
        console.error(err);
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove("session");
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(`/auth/login?redirect=/apps/${appid}/security`);
          } else if (err.response.status === 400) {
            toast.error("Error 400 | Bad Request");
          } else if (err.response.status === 404) {
            toast.error("Error 404 | Not Found");
          } else if (err.response.status === 500) {
            toast.error("Error 500 | Internal Server Error");
          }
        }
      })
      .finally(() => {
        setButtonLoading(false);
      });
  };

  const getDatabases = () => {
    setLoading(true);
    api
      .get("/databases", {
        params: {
          subdomain: appid,
        },
        signal: databasesController.signal,
      })
      .then((res) => {
        setDbId(res.data.data.databases[0].db_id);
      })
      .catch((err) => {
        console.error(err);
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove("session");
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(`/auth/login?redirect=/apps/${appid}/security`);
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

  const secretHandler = (event) => {
    setSecret(event.target.value);
  };

  const algorithmHandler = (value) => {
    setAlogorithm(value);
  };

  const authorizationTokenHandler = (event) => {
    setAuthHeaderName(event.target.value);
  };

 
  const userSessionKeyHandler = (event) => {
    setUsersessionkey(event.target.value);
  }
  const userRoleHandler = (event) => {
    setRoleSessionKey(event.target.value);

  }
  const tableHandler = (value) => {
    setSelectedTable(value);
  }
  const columnHandler = (value) => {
    setSelectedColumn(value);
    ;
  }
  const renderParamMap = () => {
    // return null
    if (!dbId || !auth) return null;
    return (
      <ParamMapList
        appid={appid}
        db_id={dbId}
        sessionKeyValues={auth?.session_key_values}
        getAuth={getAuth}
      />
    );
  };

  const toggleModalState = () => {
    if(modalState && auth){  
      setAuthData(auth)
    }
    setModalState(!modalState);
  };
  const renderData = () => {
    if (loading) {
      return (
        <div className="loading-div">
          <Spinner className="loading-spinner" color="primary" type="grow" />
        </div>
      );
    } else if (!auth) {
      return (
        <div
          className="enums-list-enum enums-list-enum-create enums-list-enum-empty"
          key="empty"
          onClick={toggleModalState}
        >
          Click to Setup Authentication
        </div>
      );
    } else {
      return (
        <>
          <div
            style={{
              height: "calc(-227px + 100vh)",
              overflowY: "auto",
              paddingRight: "5px",
              paddingTop:"25px",
              position:'relative'
            }}
          >            
               <span style={{ position: "absolute", right: "7px", top: "4px", display:   'inline-block' , zIndex:100, float:"right"   }}>
          <Button
              color='falcon-danger'
              onClick={toggleModalState}
          >
              <FontAwesomeIcon icon={faEdit} />

          </Button>
      </span>
            <Label className="list-card-label security-auth-dropdown-bx">
              Algorithm
              <Select
                autoFocus
                classNamePrefix="react-select"
                hideSelectedOptions
                noOptionsMessage={() => "No Algorithm match the search term"}
                // onChange={algorithmHandler}
                options={algorithmList}
                placeholder="Select Algorithm"
                value={alogorithm}
                isDisabled={true}
              />


            </Label>

            <Label className="list-card-label">
              Client Secrets
              <EditableTextArea
                placeholder={"Enter client secret here"}
                onChange={secretHandler}
                value={secret}
                readOnly={true}
              />
            </Label>
            <Label className="list-card-label">
          User Session Key
            <Input
              placeholder={"User Session Key  "}
              type="text"
              onChange={userSessionKeyHandler}
              value={userSessionKey}
              readOnly={true}
               disabled
              // disabled
            />
          </Label>
          <Label className="list-card-label">
            User Session Column
            <Input
              placeholder={"Selected Column "}
              type="text"
              // onChange={authorizationTokenHandler}
              value={selectedColumn?.label}
              readOnly={true}
               disabled
              // disabled
            />
          </Label>
          <Label className="list-card-label">
          Role Session Key
            <Input
              placeholder={"Role Session Key "}
              type="text"
              onChange={userRoleHandler}
              value={roleSessionKey}
              readOnly={true}
               disabled
              // disabled
            />
          </Label>


          <Label className="list-card-label">
            Authorization Header Token Name 
            <Input
              placeholder={"Enter authorization Header token name  "}
              type="text"
              onChange={authorizationTokenHandler}
              value={authHeaderName}
              readOnly={true}
               disabled
              // disabled
            />
          </Label>
            {renderParamMap()}
          </div>
          {auth ? (
            <div className="dashboard-modal-share-button security-auth-btn-bx" style={{display:'none'}}  >
              <Button
                block
                color="falcon-danger"
                disabled={buttonLoading}
                onClick={disableAuth}
                // style={{display:'none'}}
              >
                Disable Authentication <FontAwesomeIcon icon={faLockOpen} />
              </Button>

              <Button
                color="falcon-success"
                disabled={
                  !secret.length || buttonLoading || !Boolean(alogorithm)
                }
                onClick={updateAuth}
              >
                Update Authentication <FontAwesomeIcon icon={faSave} />
              </Button>
            </div>
          ) : (
            <Button
              block
              color="falcon-success"
              disabled={!secret.length || buttonLoading || !Boolean(alogorithm)}
              onClick={enableAuth}
            >
              Enable Authentication <FontAwesomeIcon icon={faLock} />
            </Button>
          )}
        </>
      );
    }
  };

  if(!dbId ){ 
   return ( <div className="loading-div">
    <Spinner className="loading-spinner" color="primary" type="grow" />
  </div>);
  }
 
  return (
    <div>
      {renderData()}
      <SetupAuthModal
        modalState={modalState}
        secretHandler={secretHandler}
        secret={secret}
        algorithmHandler={algorithmHandler}
        authHeaderName={authHeaderName}
        authorizationTokenHandler={authorizationTokenHandler}
        
        roleSessionKey={roleSessionKey}
        userRoleHandler={userRoleHandler}

        userSessionKey={userSessionKey}
        userSessionKeyHandler={userSessionKeyHandler}

        selectedTable={selectedTable}
        tableHandler={tableHandler}

        selectedColumn={selectedColumn}
        columnHandler={columnHandler} 


        alogorithm={alogorithm}
        algorithmList={algorithmList}
        toggleModalState={toggleModalState}
        enableAuth={enableAuth}
        updateAuth={updateAuth}
        auth={auth}

        appid={appid}
        db_id={dbId}
         
      />
    </div>
  );
};

export default Authentication;
