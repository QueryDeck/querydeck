// React imports
import React, { useEffect, useReducer, useRef } from "react";
import { useHistory } from "react-router-dom";
import Badge from "@mui/material/Badge";

// Redux
import { useSelector } from "react-redux";

// Reducers
import menuReducer from "../../reducers/menu/menuReducer";

// Library imports
import {
  faBox,
  faCode,
  faDatabase,
  faUserShield,
  faCloud
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "reactstrap";

// Abort controllers for cancelling network requests
let changePasswordController;
let logoutController;

// Menu inside all apps
const Menu = (props) => {
  // Redux
  const reduxState = useSelector(state => state.data.deployments)

  // Props
  const { appid } = props;

  // For 403 errors on unauthorised users
  const history = useHistory();

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

  return (
    <div className="list-card-side">
      <div>
        <Button
          className='menu-btn'
          color="falcon-primary"
          id="tour_api-builder"
          onClick={() => history.push(`/apps/${appid}/api`)}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          {`{...}`} {state.tooltip ? <span>REST APIs</span> : ""}
        </Button>
        <Button
          className='menu-btn'
          color="falcon-primary"
          id="tour_api-saved"
          onClick={() => history.push(`/apps/${appid}/graphql`)}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <FontAwesomeIcon icon={faCode} />{" "}
          {state.tooltip ? <span>GraphQL</span> : ""}
        </Button>
        <Button
          className="menu-btn"
          color="falcon-primary"
          id="tour_databases"
          onClick={() => history.push(`/apps/${appid}/storage`)}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <FontAwesomeIcon icon={faBox} />{" "}
          {state.tooltip ? <span>Storage</span> : ""}
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
    </div>
  );
};

export default Menu;
