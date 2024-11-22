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
import AddCustomDomainsModal from "./modal/AddCustomDomainsModal";
import DeleteCustomDomainsModal from "./modal/DeleteCustomDomainsModal";

// API
import api from "../../../../api";

// Controllers
let getDomainsController;
let addNewDomainController;
let deleteDomainController;

const CustomDomains = (props) => {
  // Redux
  const reduxDispatch = useDispatch();

  const [domains, setDomains] = useState(null);
  const [modalState, setModalState] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);

  const history = useHistory();

  useEffect(() => {
    getDomainsController = new AbortController();
    addNewDomainController = new AbortController();
    deleteDomainController = new AbortController();

    getDomains();

    return () => {
      getDomainsController.abort();
      addNewDomainController.abort();
      deleteDomainController.abort();
    };
    // eslint-disable-next-line
  }, []);

  // add  modal
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
  const openDeleteModal = (domain) => {
    setSelectedDomain(domain);
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
      const response = await api.get("/apps/editor/custom-domains", {
        params: {
          subdomain: props.subdomain,
        },
        signal: getDomainsController.signal,
      });
      const data = response.data.data;
      setDomains(data.length ? data : []);
    } catch (error) {
      catchError(error);
    }
  };

  const addDomain = async (inputDomain) => {
    const currDomains = [inputDomain];
    closeModal();
    setDomains(null);

    try {
      await api.post(
        "/apps/editor/custom-domains",
        {
          custom_domains: currDomains,
          subdomain: props.subdomain,
        },
        {
          signal: addNewDomainController.signal,
        }
      );
      getDomains();
      toast.success("Added new domain");
    } catch (error) {
      catchError(error);
    }
  };

  const removeDomain = async () => {
    const currDomain = selectedDomain;
    try {
      setDomains(null);
      await api.delete(
        "/apps/editor/custom-domains",
        {
          data: {
            custom_domain_id: currDomain?.custom_domain_id,
            subdomain: props.subdomain,
          },
        },
        {
          signal: deleteDomainController.signal,
        }
      );
      closeDeleteModal();
      setSelectedDomain(null);
      getDomains();
      toast.success("Removed domain");
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
          value={domains[index].domain}
          disabled={true}
          readOnly={true}
        />
        <Button
          color="falcon-danger"
          onClick={() => openDeleteModal(domains[index])}
          style={{ margin: "0 0 0 8px", visibility: "visible" }}
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
          Click to add Custom Domain
        </div>
      );
    } else {
      return (
        <>
          <div
            style={{
              height: "calc(-315.817px + 100vh)",
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
    <div style={{ maxWidth: "728px", margin: "auto" }}>
      {renderData()}
      <AddCustomDomainsModal
        addDomain={addDomain}
        modalState={modalState}
        closeModal={closeModal}
      />
      <DeleteCustomDomainsModal
        selectedDomain={selectedDomain?.domain || ""}
        modalState={deleteModalState}
        closeModal={closeDeleteModal}
        removeDomain={removeDomain}
      />
    </div>
  );
};

export default CustomDomains;
