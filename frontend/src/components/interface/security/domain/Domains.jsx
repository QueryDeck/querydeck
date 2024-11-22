// React imports
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch } from "react-redux";

// Library imports
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Cookies from "js-cookie";
import { Button, Input, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import AddDomainModal from "./modal/AddDomainModal";
import DeleteDomainModal from "./modal/DeleteDomainModal";

// API
import api from "../../../../api";

// Controllers
let getDomainsController;
let updateDomainsController;

const Domains = (props) => {
  const [domains, setDomains] = useState(null);
  const [modalState, setModalState] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState(false);
  const [selectedDomainIndex, setSelectedDomainIndex] = useState(null);

  // Redux
  const reduxDispatch = useDispatch();

  const history = useHistory();

  useEffect(() => {
    getDomainsController = new AbortController();
    updateDomainsController = new AbortController();

    getDomains();

    return () => {
      getDomainsController.abort();
      updateDomainsController.abort();
    };
    // eslint-disable-next-line
  }, []);

  const addDomain = (inputDomain) => {
    const currDomains = [...domains, inputDomain];
    setDomains(null);
    updateDomains(currDomains);
    closeModal();
  };

  const removeDomain = () => {
    const index = selectedDomainIndex;
    const currDomains = domains
      .slice(0, index)
      .concat(domains.slice(index + 1, domains.length));
    setDomains(null);
    updateDomains(currDomains);
    closeDeleteModal();
    setSelectedDomainIndex(null);
  };

  // add   modal
  const closeModal = () => {
    setModalState(false);
  };
  const openModal = () => {
    setModalState(true);
  };

  // delete modal
  const closeDeleteModal = () => {
    setDeleteModalState(false);
  };
  const openDeleteModal = (index) => {
    setSelectedDomainIndex(index);
    setDeleteModalState(true);
  };

  ///// Network requests /////
  const catchError = (error) => {
    if (error.response) {
      if (error.response.data.meta.status === 403) {
        Cookies.remove("session");
        toast.warning(`Please login again`);
        reduxDispatch({ type: "RESET" });
        history.push(`/auth/login?redirect=/apps/${props.subdomain}/security`);
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

  const getDomains = async () => {
    try {
      const response = await api.get("/apps/editor/controllers/cors-domain", {
        params: {
          subdomain: props.subdomain,
        },
        signal: getDomainsController.signal,
      });
      const data = response.data.data.cors;
      setDomains(data.length ? data : []);
    } catch (error) {
      catchError(error);
    }
  };

  const updateDomains = async (allDomains) => {
    try {
      await api.put(
        "/apps/editor/controllers/cors-domain",
        {
          cors: allDomains,
          subdomain: props.subdomain,
        },
        {
          signal: updateDomainsController.signal,
        }
      );
      getDomains();
      toast.success("Domains Updated!");
    } catch (error) {
      catchError(error);
    }
  };

  const renderDomain = (domain, index) => {
    return (
      <div
        key={index}
        style={{
          display: "flex",
          padding: "4px 10px",
        }}
      >
        <Input
          style={{ flex: "1 0 0" }}
          value={domains[index]}
          disabled={true}
          readOnly={true}
        />
        <Button
          color="falcon-danger"
          onClick={() => openDeleteModal(index)}
          style={{ margin: "0 0 0 8px" }}
        >
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      </div>
    );
  };

  const renderData = () => {
    if (!domains) {
      return (
        <div className="loading-div">
          <Spinner className="loading-spinner" color="primary" type="grow" />
        </div>
      );
    } else if (domains.length === 0) {
      return (
        <div
          className="enums-list-enum enums-list-enum-create enums-list-enum-empty"
          key="empty"
          onClick={openModal}
        >
          Click to add Domain
        </div>
      );
    } else {
      return (
        <>
          <div
            style={{
              height: "calc(-266.817px + 100vh)",
              overflow: "auto",
              padding: "8px 0",
            }}
          >
            {}
            {domains.map((domain, index) => renderDomain(domain, index))}
          </div>

          <Button block color="falcon-primary" onClick={openModal}>
            Add More <FontAwesomeIcon icon={faPlus} />
          </Button>
        </>
      );
    }
  };

  return (
    <div>
      {renderData()}
      <AddDomainModal
        addDomain={addDomain}
        modalState={modalState}
        closeModal={closeModal}
      />
      <DeleteDomainModal
        selectedDomain={domains && domains[selectedDomainIndex]}
        modalState={deleteModalState}
        closeModal={closeDeleteModal}
        removeDomain={removeDomain}
      />
    </div>
  );
};

export default Domains;
