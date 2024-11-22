// React imports
import React, { useEffect } from "react";
import api from "../../../../api";
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch } from 'react-redux'

// Library imports
import {
  faSave,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ModalBody, ModalFooter, Spinner } from "reactstrap";
import { toast } from "react-toastify";

// Components
import CustomSelect from "../../../../components/common/CustomSelect";
let loadAllRepoController;
let pushToRepoController;

const Table = ({
  updateSetupRopoStep,
  state,
  updateAttribute,
  updatRepoList,
  subdomain,
  getGithubStatus,
  closeModal,
}) => {
  // Redux
  const reduxDispatch = useDispatch()

  const history = useHistory();

  useEffect(() => {
    loadAllRepoController = new AbortController();
    pushToRepoController = new AbortController();

    return () => {
      loadAllRepoController.abort();
      pushToRepoController.abort();
    };
  }, []);
  useEffect(() => {
    loadAllRepo();
  }, []);

  ///// Network requests /////
  const catchError = (error) => {
    if (error.response) {
      if (error.response.data.meta.status === 403) {
        toast.warning(`Please login again`);
        reduxDispatch({ type: 'RESET' })
        history.push(`/auth/login?redirect=/apps/${subdomain}/deploy`);
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
  // set repo
  const setRepo = (value) => {
    updateAttribute("selectedRepo", value);
  };

  // Renders column selector
  const renderToolbar = () => {
    return (
      <div className="query-modal-columns-vanilla-content mt-3">
        <div className="query-modal-columns-vanilla-columns">
          <CustomSelect
            // defaultMenuIsOpen={true}
            noOptionsMessage={() => "No repository match the search term"}
            onChange={(value) => setRepo(value)}
            options={state.repoList}
            placeholder="Select Repository"
            value={state.selectedRepo}
          />
        </div>
      </div>
    );
  };

  const loadAllRepo = async () => {
    try {
      updateAttribute("loading", true);
      const response = await api.get("/apps/git/installed-repos", {
        signal: loadAllRepoController.signal,
      });
      // response.data.data= []
      if (response.data.data.length === 0) {
        toast.warning(
          `No Github Repository setup. Please Follow the given Steps`
        );
        updateAttribute("modalStep", 1);
      } else {
        updatRepoList(response.data.data);
      }
    } catch (error) {
      catchError(error);
    }
  };

  const makepushToRepo = async () => {
    try {
      const requestBody = {
        github_repo_name: state.selectedRepo.value,
        subdomain,
      };

      await api.post("/apps/git/link-repo-and-push", requestBody, {
        signal: pushToRepoController.signal,
      });
      toast.success(`Successfully pushed changes to Repository`);
      getGithubStatus()
      closeModal()
      // dispatch(
      //   closeAutoGenerateModal({
      //     mode: props.mode,
      //     query_id: props.query_id,
      //     subdomain: props.subdomain,
      //   })
      // );
    } catch (error) {
      catchError(error);
    }
  };
  if (state.loading) {
    return (
      <ModalBody className="query-modal-columns-body deploy-repo-modal-body">
        <div className="loading-div">
          <Spinner className="loading-spinner" color="primary" type="grow" />
        </div>
      </ModalBody>
    );
  }
  return (
    <>
      <ModalBody className="query-modal-columns-body deploy-repo-modal-body">
        {renderToolbar()}
      </ModalBody>
      <ModalFooter>
        <div className="query-modal-columns-vanilla-footer">
          <Button
            block
            color="falcon-danger"
            onClick={() => updateSetupRopoStep(1)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            &nbsp;Back
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            block
            color="falcon-success"
            onClick={makepushToRepo}
            disabled={!Boolean(state.selectedRepo)}
          >
            Make your first commit and push &nbsp;
            <FontAwesomeIcon icon={faSave} />
          </Button>
        </div>
      </ModalFooter>
    </>
  );
};

export default Table;
