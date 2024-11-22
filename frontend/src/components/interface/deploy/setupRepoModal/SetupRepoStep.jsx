// React imports
import React from "react";

// Library imports
import { faTimes, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ModalBody, ModalFooter, List } from "reactstrap";

const SetupRepoStep = ({ updateSetupRopoStep, state, closeModal }) => {
  // Renders column selector
  const renderToolbar = () => {
    return (
      <div className="query-modal-columns-vanilla-content mt-3">
        <div className="query-modal-columns-vanilla-columns ">
          <List type="unstyled">
            <li>
              <div className="query-wizard-header-subheading deploy-repo-modal-instuction">
                <span> 1.</span>
                <p className="deploy-repo-modal-instuction-text">
                  Create a new repository on your{" "}
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Github{" "}
                  </a>{" "}
                  account.
                </p>
              </div>
            </li>

            <li>
              <div className="query-wizard-header-subheading deploy-repo-modal-instuction">
                <span> 2.</span>
                <p className="deploy-repo-modal-instuction-text">
                  Open the QueryDeck Github app{" "}
                  <a
                    href="https://github.com/apps/querydeck-git-connect"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    link{" "}
                  </a>
                  . Connect your Github account and click Install{" "}
                </p>
              </div>
            </li>

            <li>
              <div className="query-wizard-header-subheading deploy-repo-modal-instuction">
                <span> 3.</span>
                <p className="deploy-repo-modal-instuction-text">
                  On the installation screen, choose{" "}
                  <b>'Only select repositories' </b> and select the new
                  repository and click Install
                </p>
              </div>
            </li>
          </List>
        </div>
      </div>
    );
  };

  return (
    <>
      <ModalBody className="query-modal-columns-body deploy-repo-modal-body">
        {/* {renderTabs()} */}
        {renderToolbar()}
      </ModalBody>
      <ModalFooter>
        <div className="query-modal-columns-vanilla-footer">
          <Button block color="falcon-danger" onClick={closeModal}>
            Close &nbsp;
            <FontAwesomeIcon icon={faTimes} />
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            block
            color="falcon-success"
            onClick={() => updateSetupRopoStep(2)}
            disabled={false}
          >
            Next &nbsp;
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </div>
      </ModalFooter>
    </>
  );
};

export default SetupRepoStep;
