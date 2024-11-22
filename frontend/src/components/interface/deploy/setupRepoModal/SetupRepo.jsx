// React imports
import React, { useReducer } from "react";

// Redux

// Library imports
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
} from "reactstrap";

import setupRepoReducer from "../../../reducers/deploy/setupRepoReducer";
// Components
import SetupRepoStep from "./SetupRepoStep";
import PushInRepoStep from "./PushInRepoStep";

const SetupRepo = (props) => {
 
  const initialState = {
    loading: false,
    modalState:props.setupRepoModalState ,
    modalStep:1, 
    repoList: [], 
    selectedRepo:null
  };
  const [state, dispatch] = useReducer(setupRepoReducer, initialState);


 
  const closeModal = () => { 

    dispatch({
      type: "UPDATE_ATTRIBUTE",
      field: "modalState",
      value: false,
    });
  }



    const updateSetupRopoStep = (stepNumber) => {
      dispatch({
        type: "UPDATE_ATTRIBUTE",
        field: 'modalStep',
        value: stepNumber,
      });
    };
    const updateAttribute = (field , value ) => {
      dispatch({
        type: "UPDATE_ATTRIBUTE",
        field: field,
        value: value,
      });
    };
    const updatRepoList = (repoData) => {
      dispatch({
        type: "UPDATE_REPO_LIST",
        repoData, 
      });
    };
  const render = () => {
    if (   state.modalStep === 1) {
      return (
       <SetupRepoStep
          closeModal={closeModal}
          subdomain={props.subdomain}
          updateSetupRopoStep={updateSetupRopoStep}
          updateAttribute={updateAttribute}
          state={state}

        />
      );
    } else if ( state.modalStep === 2) {
      return (
        <PushInRepoStep
          closeModal={closeModal}
          subdomain={props.subdomain}
          updateSetupRopoStep={updateSetupRopoStep}
          updateAttribute={updateAttribute}
          updatRepoList={updatRepoList}
          getGithubStatus={props.getGithubStatus}

          state={state}

        />
      );
    } else {
      return (
        <>
          <ModalBody className="query-modal-columns-body">
            <div className="loading-div">
              <Spinner
                className="loading-spinner"
                color="primary"
                type="grow"
              />
            </div>
          </ModalBody>
        </>
      );
    }
  };

 

   
    return (
      <Modal
        className="query-modal-columns"
        isOpen={state.modalState}
        toggle={closeModal}
        style={{top:'6%'}}
      >
        <ModalHeader className="modal-header clearfix">
          <div className="float-left">Setup Github Repository</div>
          <Button
            className="float-right"
            color="falcon-danger"
            onClick={closeModal}
            size="sm"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </ModalHeader>

        {render()}
      </Modal>
    );
 
};

export default SetupRepo;
