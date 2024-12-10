// React imports
import React, { useState } from "react";
import { Helmet } from "react-helmet";
// Library imports
import { faGlobe, faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Components
import Menu from "../menu/Menu";
import Header from '../../../app/projects/[subdomain]/components/sections/engine/header';
import Github from "./Github";
import Cloud from "./Cloud";

const Deploy = (props) => {
  const [tab, setTab] = useState("github");

  const changeTab = (newTab) => {
    setTab(newTab);
  };

  const renderData = () => {
    return (
      <div className="list-deck">
        <Menu appid={props.appid} />
        <div style={{ flex: '1 0 0' }}>
          <Header
            mode='api'
            section='Deployment'
            subdomain={props.subdomain}
          />
          <Card className="list-card-main">
            <Nav tabs>
              <NavItem className="query-right-nav cursor-pointer" id="query">
                <NavLink
                  className={tab !== "github" ? "active" : ""}
                  onClick={() => (tab !== "github" ? changeTab("github") : "")}
                >
                  Github <FontAwesomeIcon icon={faGlobe} />
                </NavLink>
              </NavItem>
              <NavItem className="query-right-nav cursor-pointer">
                <NavLink
                  className={tab !== "cloud" ? "active" : ""}
                  onClick={() => (tab !== "cloud" ? changeTab("cloud") : "")}
                >
                  Cloud <FontAwesomeIcon icon={faCloudUploadAlt} />
                </NavLink>
              </NavItem>
            </Nav>
            <div className={`${tab}-list`}>
              <TabContent activeTab={tab} className="query-right-tab">
                <TabPane tabId="github">
                  <div className="databases-list" style={{ margin: "0 auto" }}>
                    <CardHeader>
                      <h2 className="apps-heading">Github Deployment</h2>
                    </CardHeader>
                    <CardBody style={{paddingTop: 0}}>
                      <Github subdomain={props.appid} redirect={props.redirect} />
                    </CardBody>
                  </div>
                </TabPane>
                <TabPane tabId="cloud">
                  <Cloud subdomain={props.appid} />
                </TabPane>
              </TabContent>
            </div>

            {/* <div className={`domain-list`}>
      
          
                  <div
                    className='databases-list'
                    style={{ margin: '0 auto' }}
                  >
                    <CardHeader>
                      <h2 className='apps-heading'>Deploy App</h2>
                    </CardHeader>
                    <CardBody>
                      <Github subdomain={props.appid} redirect={props.redirect} />
                    </CardBody>
                  </div>
              
          
            </div>
            */}
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Helmet>
        <title>Deploy | QueryDeck</title>
      </Helmet>
      {renderData()}
    </div>
  );
};

export default Deploy;
