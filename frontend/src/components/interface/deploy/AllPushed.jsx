// React imports
import React from "react";

// Library imports
import {

  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  Card, CardText, CardTitle } from "reactstrap";
 
// API

const AllPushed = (props) => {

  return (
    <>
      <Card body className="deploy-repo-allpushed-bx">
        <CardText>
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="deploy-repo-allpushed-check-icon"
          />
        </CardText>
        <CardTitle tag="h5" className="deploy-repo-allpushed-title">
          Every thing is up to date
        </CardTitle>
      </Card>
    </>
  );
};

export default AllPushed;
