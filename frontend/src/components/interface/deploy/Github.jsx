// React imports
import React, { useEffect, useReducer } from "react";
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch } from "react-redux";
import { updateDeploymentDiff } from "../../../lib/data/dataSlice";

// Library imports
import { faLink, faWrench } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Cookies from "js-cookie";
import { Button, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import githubReducer from "../../reducers/deploy/githubReducer";
import useQueryParams from "../../../hooks/useQueryParams";
import SetupRopo from "./setupRepoModal/SetupRepo";
import DiffView from "./DiffView";
import CommitHistory from "./commit/CommitHistory";
import AllPushed from "./AllPushed";

// API
import api  , { apiurl} from "../../../api";

// Controllers
let getGithubRedirectUrlController;
let getGithubStatusController;
let getGithubDiffController;
let verfityGithubTokenController;
let pushChangesToRepoController;
let getGithubDiffVerboseController;
let getGithubCommitHistoryController;

const Github = (props) => {
  // Redux
  const reduxDispatch = useDispatch();

  const initialState = {
    loading: true,
    githubStatus: 0,
    repoUrl: "",
    setupRepoModalState: false,
    SetupRopoCompKey: "100000",
    diff: { totalChanges: 0, text: "" },
    diffVerbose: {
      deleted: [],
      added: [],
      modified: [],
      text: "",
    },
    commits: [],
    commitModalState: false,
    // tableData: [] ,
  };
  const [state, dispatch] = useReducer(githubReducer, initialState);

  const queryParams = useQueryParams();
  const history = useHistory();

  useEffect(() => {
    getGithubRedirectUrlController = new AbortController();
    getGithubStatusController = new AbortController();
    getGithubDiffController = new AbortController();
    pushChangesToRepoController = new AbortController();
    verfityGithubTokenController = new AbortController();
    getGithubDiffVerboseController = new AbortController();
    getGithubCommitHistoryController = new AbortController();

    if (props.redirect) {
      verifyGithubToken();
    } else {
      getGithubStatus();
    }

    return () => {
      getGithubRedirectUrlController.abort();
      getGithubStatusController.abort();
      getGithubDiffController.abort();
      pushChangesToRepoController.abort();
      verfityGithubTokenController.abort();
      getGithubDiffVerboseController.abort();
      getGithubCommitHistoryController.abort();
    };
    // eslint-disable-next-line
  }, []);

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
        history.push(`/auth/login?redirect=/apps/${props.subdomain}/deploy`);
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
  const getGithubStatus = async () => {
    try {
      updateAttribute("loading", true);
      const response = await api.get("/apps/git/status", {
        params: {
          subdomain: props.subdomain,
        },
        signal: getGithubStatusController.signal,
      });

      // updatRepoList(response.data.data);
      let loading = false;
      if (response.data.data.status === 20) {
        getGithubDiff(); //load diff
        getGithubDiffVerbose(); // load diff verbose
        getGithubCommitHistory(); // load commit history
        loading = true;
      }
      dispatch({
        type: "SET_GITHUB_STATUS",
        githubStatus: response.data.data.status,
        repoUrl: response.data.data.repo_url,
        loading,
      });
    } catch (error) {
      catchError(error);
    }
  };

  const getGithubDiff = async () => {
    try {
      updateAttribute("loading", true);
      const response = await api.get("/apps/git/diff", {
        params: {
          subdomain: props.subdomain,
        },
        signal: getGithubDiffController.signal,
      });
      // updatRepoList(response.data.data);
      reduxDispatch(
        updateDeploymentDiff({
          subdomain: props.subdomain,
          diff: response.data.data.diff,
        })
      );
      dispatch({
        type: "SET_GITHUB_DIFF",
        diff: response.data.data.diff,
      });
    } catch (error) {
      catchError(error);
    }
  };

  const getGithubDiffVerbose = async () => {
    // return
    try {
      updateAttribute("loading", true);
      const response = await api.get("/apps/git/diff-verbose", {
        params: {
          subdomain: props.subdomain,
        },
        signal: getGithubDiffVerboseController.signal,
      });
      dispatch({
        type: "SET_GITHUB_DIFF_VERBOSE",
        diffVerbose: response.data.data,
      });
    } catch (error) {
      catchError(error);
    }
  };

  const getGithubCommitHistory = async () => {
    // return
    try {
      // updateAttribute("loading", true);
      const response = await api.get("/apps/git/commits", {
        params: {
          subdomain: props.subdomain,
        },
        signal: getGithubCommitHistoryController.signal,
      });
      dispatch({
        type: "SET_GITHUB_COMMIT_HISTORY",
        commits: response.data.data,
      });
    } catch (error) {
      catchError(error);
    }
  };

  const getGithubRedirectUrl = async () => {
    try {
      dispatch({
        type: "START_LOADING",
      });
      const response = await api.get("/github/generate-oauth-url", {
        params: { subdomain: props.subdomain },
        signal: getGithubRedirectUrlController.signal,
      });
      const data = response.data.data;
      const parseUrl = new URL(data.url);

      let finalUrl = `${parseUrl.origin}${
        parseUrl.pathname
      }?client_id=${parseUrl.searchParams.get(
        "client_id"
      )}&state=${parseUrl.searchParams.get("state")}&redirect_uri=${
        apiurl
      }/github/auth-callback`;

      sessionStorage.setItem(
        "github",
        JSON.stringify({ subdomain: props.subdomain })
      );
      if (window?.location?.replace) {
        window.location.replace(finalUrl);
      } else if (window?.open) {
        window.open(finalUrl, "_self");
      }
    } catch (error) {
      catchError(error);
    }
  };

  const pushChangesToRepo = async () => {
    try {
      dispatch({
        type: "START_LOADING",
      });
      const requestBody = {
        subdomain: props.subdomain,
        commitMessage: state.diffVerbose.text,
      };

      await api.post("/apps/git/push", requestBody, {
        signal: pushChangesToRepoController.signal,
      });
      toast.success(`Successfully pushed changes to Repository`);
      getGithubStatus();
      // closeModal()
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
  const reRenderSetupRepoModal = async () => {
    updateAttribute("setupRepoModalState", true);
    updateAttribute("SetupRopoCompKey", String(Math.random()));
  };
  const verifyGithubToken = async () => {
    if (!queryParams.state || !queryParams.code) {
      toast.error("invalid url");
      return;
    }
    try {
      dispatch({
        type: "START_LOADING",
      });
      await api.get("/github/auth-callback", {
        params: {
          code: queryParams.code,
          state: queryParams.state,
        },

        signal: verfityGithubTokenController.signal,
      });

      dispatch({
        type: "UPDATE_ATTRIBUTE",
        field: "loading",
        value: false,
      });
      toast.success("Github Verfication Successful");
      const githubSessionData = JSON.parse(sessionStorage.getItem("github"));
      if (githubSessionData?.subdomain) {
        history.replace(`/apps/${githubSessionData.subdomain}/deploy`);
      } else {
        history.replace(`/apps`);
      }
      // if (window?.location?.replace) {
      //   window.location.replace(finalUrl);
      // } else if (window?.open) {
      //   window.open(finalUrl, "_self");
      // }
    } catch (error) {
      catchError(error);
    }
  };
  const toggleCommitModalState = () => {
    updateAttribute("commitModalState", !state.commitModalState);
  };
  const renderData = () => {
    /* 
githubStatus
  0 = no integration, show github oauth button
  10 = oauth done but app not installed, show installation and repo selection flow
  20 = repo integration done, show diff and commit + push
*/
    if (state.loading) {
      return (
        <div className="loading-div">
          <Spinner className="loading-spinner" color="primary" type="grow" />
        </div>
      );
    } else if (state.githubStatus === 20) {
      const CommitHistoryComponent = (
        <CommitHistory
          subdomain={props.subdomain}
          commits={state.commits}
          repoUrl={state.repoUrl}
          commitModalState={state.commitModalState}
          toggleCommitModalState={toggleCommitModalState}
        />
      );
      if (state.diff.totalChanges > 0) {
        return (
          <>
            {CommitHistoryComponent}
            <DiffView
              diff={state.diff}
              diffVerbose={state.diffVerbose}
              pushChangesToRepo={pushChangesToRepo}
            />
          </>
        );
      } else {
        return (
          <>
            {CommitHistoryComponent}
            <AllPushed />
          </>
        );
      }
    } else if (state.githubStatus === 10) {
      return (
        <>
          <br />
          <Button block color="falcon-primary" onClick={reRenderSetupRepoModal}>
            Setup Repository &nbsp; <FontAwesomeIcon icon={faWrench} />
          </Button>

          <div
            style={{
              height:
                "calc(100vh - 4px - 4px - 56px - 4px - 79.8167px - 20px - 20px - 36px - 42px - 40px)",
              overflow: "auto",
              padding: "8px 0",
            }}
          ></div>
          <SetupRopo
            key={state.SetupRopoCompKey}
            subdomain={props.subdomain}
            setupRepoModalState={state.setupRepoModalState}
            getGithubStatus={getGithubStatus}
          />
        </>
      );
    } else if (state.githubStatus === 0) {
      return (
        <>
          <br />
          <Button block color="falcon-primary" onClick={getGithubRedirectUrl}>
            Integrate With Github &nbsp; <FontAwesomeIcon icon={faLink} />
          </Button>
          <div
            style={{
              height:
                "calc(100vh - 4px - 4px - 56px - 4px - 79.8167px - 20px - 20px - 36px - 42px - 40px)",
              overflow: "auto",
              padding: "8px 0",
            }}
          >
            {/* {githubRedirectUrl.map((domain, index) => renderDomain(domain, index))} */}
          </div>
          {/* <Button
            block
            color='falcon-success'
            onClick={updateDomains}
          >
            Save <FontAwesomeIcon icon={faSave} />
          </Button> */}
        </>
      );
    }
  };

  return <div>{renderData()}</div>;
};

export default Github;
