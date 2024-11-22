// handle conflicts in postgres and mysql insert/upsert
import React, { useEffect, useState } from "react";
// import {
//   Badge,
// } from "reactstrap";
import api from "../../../api";
let getSubdomainAppController;
const AppNameLogo = () => {
  const [appDetails, setAppDetails] = useState(false);

  useEffect(() => {

    getSubdomainAppController = new AbortController();
    setAppDetails(null)
    getSubdomainAppDetails();

    return () => {
      getSubdomainAppController.abort();
    };
  }, [window.location.pathname?.split("/")[2]]);




  const getSubdomainAppDetails = async () => {
    try {
      const subdomain = window.location.pathname?.split("/")[2];
      if (!subdomain) return console.error("missing subdomain");
      const response = await api.get("/apps/subdoman-app", {
        params: {
          subdomain: subdomain,
        },
        signal: getSubdomainAppController.signal,
      });
      const data = response.data.data;
      setAppDetails(data);
    } catch (error) {
      console.error(error);
    }
  };


  if (!appDetails) return null;
  return (
    <>
      <h6
        className="badge-nav"
        color="primary"
        style={{
          // background: "#2c7be5",
          display: "inline-block",
          position: "absolute",
          height: "20px",
          top: "8px",
          left: "46%",
          zIndex: "500",
          fontWeight: "600",
          fontSize: "19px",

        }}
      >
        {appDetails.app_name}
      </h6>
    </>
  );
};

export default AppNameLogo;
