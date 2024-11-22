// React imports
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useHistory } from "react-router-dom";

// Library imports
import {
  faGlobe,
  faUserShield,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Card,
  CardBody,
  CardHeader,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";

// Components
import Menu from "../menu/Menu";
import Domains from "./domain/Domains";
import Authentication from "./authentication/Authentication";
import Authorization from "./authorization/Authorization";

const Security = (props) => {
  const history = useHistory();
  const [tab, setTab] = useState("domain");
  useEffect(() => {
    if (props.section) {
      if (props.section === "authentication") {
        setTab("authentication");
      } else if (props.section === "roles") {
        setTab("authorization");
      } else if (
        props.section === "cors"  
      ) {
        setTab("domain");
      }
    }else { 
      history.replace(`/apps/${props.appid}/security/cors`);

    }
  }, [props.section]);

  const changeTab = (newTab) => {
    if (newTab === "authentication") {
      history.replace(`/apps/${props.appid}/security/authentication`);
    } else if (newTab === "authorization") {
      history.replace(`/apps/${props.appid}/security/roles`);
    } else if (newTab === "domain") {
      history.replace(`/apps/${props.appid}/security/cors`);
    }
  };

  const renderData = () => {
    return (
      <div className="list-deck">
        <Menu appid={props.appid} />
        <Card className="list-card-main">
          <Nav tabs>
            <NavItem className="query-right-nav cursor-pointer" id="query">
              <NavLink
                className={tab !== "domain" ? "active" : ""}
                onClick={() => (tab !== "domain" ? changeTab("domain") : "")}
              >
                CORS <FontAwesomeIcon icon={faGlobe} />
              </NavLink>
            </NavItem>
            <NavItem className="query-right-nav cursor-pointer">
              <NavLink
                className={tab !== "authentication" ? "active" : ""}
                onClick={() =>
                  tab !== "authentication" ? changeTab("authentication") : ""
                }
              >
                Authentication <FontAwesomeIcon icon={faShieldAlt} />
              </NavLink>
            </NavItem>

            <NavItem className="query-right-nav cursor-pointer">
              <NavLink
                className={tab !== "authorization" ? "active" : ""}
                onClick={() =>
                  tab !== "authorization" ? changeTab("authorization") : ""
                }
              >
                Roles & Authorization <FontAwesomeIcon icon={faUserShield} />
              </NavLink>
            </NavItem>
          </Nav>
          <div className={`${tab}-list`}>
            <TabContent activeTab={tab} className="query-right-tab">
              <TabPane tabId="domain">
                <div className="databases-list" style={{ margin: "0 auto" }}>
                  <CardHeader>
                    <h2 className="apps-heading">CORS Domains</h2>
                  </CardHeader>
                  <CardBody>
                    <Domains subdomain={props.appid} />
                  </CardBody>
                </div>
              </TabPane>
              <TabPane tabId="authentication">
                <div className="databases-list" style={{ margin: "0 auto" }}>
                  <CardHeader>
                    <h2 className="apps-heading">Authentication</h2>
                  </CardHeader>
                  <CardBody>
                    <Authentication appid={props.appid} />
                  </CardBody>
                </div>
              </TabPane>
              <TabPane tabId="authorization">
                <div className="databases-list" style={{ margin: "0 auto" }}>
                  <CardHeader>
                    <h2 className="apps-heading">Roles & Authorization</h2>
                  </CardHeader>
                  <CardBody>
                    <Authorization
                      appid={props.appid}
                      roleId={props.roleId}
                      currSelectedTab={tab}
                    />
                  </CardBody>
                </div>
              </TabPane>
            </TabContent>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <Helmet>
        <title>Security | QueryDeck</title>
      </Helmet>
      {renderData()}
    </div>
  );
};

export default Security;
