// React imports
import React, { useEffect, useReducer, useRef } from "react";
import { useHistory } from "react-router-dom";
import { isSubdomainIsSandbox } from "../../../helpers/utils";
import Badge from "@mui/material/Badge";

// Redux
import {
  useDispatch,
  useSelector
} from "react-redux";

// Reducers
import menuReducer from "../../reducers/menu/menuReducer";

// Library imports
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";
import {
  faArrowLeft,
  faBookmark,
  faCog,
  faDatabase,
  faKey,
  faSignOutAlt,
  faUserShield,
  faCloud
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "reactstrap";

// Components
import ChangePasswordModal from "./ChangePasswordModal";

// API
import api from "../../../api";

// Secret
import secret from "../../../secret";

// Abort controllers for cancelling network requests
let changePasswordController;
let logoutController;

// Menu inside all apps
const Menu = (props) => {
  // Redux
  const reduxState = useSelector(state => state.data.deployments)
  const reduxDispatch = useDispatch();

  // Props
  const { appid } = props;

  // For 403 errors on unauthorised users
  const history = useHistory();

  // Session
  let session = {};
  if (Cookies.get("session")) {
    session = JSON.parse(CryptoJS.AES.decrypt(Cookies.get("session"), secret).toString(CryptoJS.enc.Utf8))
  }

  // Initial state
  const initialState = {
    dropdownOpen: false,
    changePasswordModalState: false,
    tooltip: false,
  };
  const timeoutIDs = useRef([]);

  const [state, dispatch] = useReducer(menuReducer, initialState);

  useEffect(() => {
    changePasswordController = new AbortController();
    logoutController = new AbortController();

    return () => {
      changePasswordController.abort();
      logoutController.abort();
    };
  }, []);

  // Shows menu tooltip
  const showTooltip = () => {
    timeoutIDs.current.push(
      setTimeout(() => {
        dispatch({
          type: "SHOW_TOOLTIP",
        });
      }, 150)
    );
  };

  // Hides menu tooltip
  const hideTooltip = () => {
    timeoutIDs.current.forEach((id) => {
      clearTimeout(id);
    });
    timeoutIDs.current = [];
    dispatch({
      type: "HIDE_TOOLTIP",
    });
  };

  // Toggles settings dropdown
  const toggleDropdown = () => {
    dispatch({
      type: "TOGGLE_DROPDOWN",
    });
  };

  const openModal = () => {
    dispatch({
      type: "OPEN_MODAL",
    });
  };

  const closeModal = () => {
    dispatch({
      type: "CLOSE_MODAL",
    });
  };

  const logout = () => {
    api
      .post("/logout", {
        signal: logoutController.signal,
      })
      .then((res) => {
        Cookies.remove("session");
        reduxDispatch({ type: "RESET" });
        history.replace("/auth/login");
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <div className="list-card-side">
      <div>
        <Button
          className='menu-btn'
          color="falcon-primary"
          id="tour_api-builder"
          onClick={() =>
            history.push(
              window.location.pathname
                .split("/")
                .slice(0, 3)
                .join("/")
                .concat("/api/new")
            )
          }
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          {`{...}`} {state.tooltip ? <span>Create API</span> : ""}
        </Button>

        <Button
          className='menu-btn'
          color="falcon-primary"
          id="tour_api-saved"
          onClick={() => history.push(`/apps/${appid}/api`)}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <FontAwesomeIcon icon={faBookmark} />{" "}
          {state.tooltip ? <span>Saved API</span> : ""}
        </Button>
        <Button
          className="menu-btn"
          color="falcon-primary"
          id="tour_databases"
          onClick={() => history.push(`/apps/${appid}/data-sources`)}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <FontAwesomeIcon icon={faDatabase} />{" "}
          {state.tooltip ? <span>Data Sources</span> : ""}
        </Button>
        <Button
          className='menu-btn'
          color="falcon-primary"
          id="tour_security"
          onClick={() => history.push(`/apps/${appid}/security`)}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <FontAwesomeIcon icon={faUserShield} />{" "}
          {state.tooltip ? <span>Security</span> : ""}
        </Button>
        <Badge
          color="primary"
          className="menu-btn-badge"
          badgeContent={reduxState[appid]?.total_changes}
          max={99}
          invisible={false}
        >
          <Button
            className='menu-btn'
            color="falcon-primary"
            id="tour_security"
            onClick={() => history.push(`/apps/${appid}/deploy`)}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          >
            <FontAwesomeIcon icon={faCloud} />{" "}
            {state.tooltip ? <span>Deploy</span> : ""}
          </Button>
        </Badge>
      </div>
      <ChangePasswordModal
        modalState={state.changePasswordModalState}
        modalHandler={closeModal}
      />

      {isSubdomainIsSandbox(appid) ? null : (
        <div>
          <Button
            className="menu-btn menu-btn-apps"
            color="falcon-primary"
            id="tour_back"
            onClick={() => history.push(`/apps`)}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          >
            <FontAwesomeIcon icon={faArrowLeft} />{" "}
            {state.tooltip ? <span>Back to Apps</span> : ""}
          </Button>

          <Dropdown
            direction="up"
            id="tour_settings"
            isOpen={state.dropdownOpen}
            toggle={toggleDropdown}
          >
            <DropdownToggle
              className="menu-btn menu-btn-exit"
              color="falcon-primary"
              onMouseEnter={showTooltip}
              onMouseLeave={hideTooltip}
            >
              <FontAwesomeIcon icon={faCog} />{" "}
              {state.tooltip ? <span>User</span> : ""}
            </DropdownToggle>
            <DropdownMenu className="menu-btn-exit-menu">
              <DropdownItem
                className="menu-btn-exit-menu-item"
                color="falcon-primary"
                disabled
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
              >
                Hi <span>{session?.user?.email}</span>
              </DropdownItem>
              <DropdownItem
                className="menu-btn-exit-menu-item"
                color="falcon-primary"
                onClick={openModal}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
              >
                <FontAwesomeIcon icon={faKey} /> <span>Change Password</span>
              </DropdownItem>
              <DropdownItem
                className="menu-btn-exit-menu-item"
                color="falcon-primary"
                onClick={logout}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
              >
                <FontAwesomeIcon icon={faSignOutAlt} /> <span>Logout</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      )}
    </div>
  );
};

export default Menu;
