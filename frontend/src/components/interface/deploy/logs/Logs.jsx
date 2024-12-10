// React imports
import React, { useEffect, useReducer } from "react";
import { useHistory } from "react-router-dom";
import { Box } from "@mui/material";
import { DataGridPro } from "@mui/x-data-grid-pro";

// Redux
import { useDispatch } from "react-redux";

// Reducers
import logsReducer from "../../../reducers/logs/logsReducer";

// Library imports
import Cookies from "js-cookie";
import { toast } from "react-toastify";

// Components

// API
import api from "../../../../api";

// Abort controllers for cancelling network requests
let loadLogsController;

// Raw query section for executing text based queries
const Logs = (props) => {
  // Redux
  const reduxDispatch = useDispatch();

  // Props
  const { appid } = props;

  // For 403 errors on unauthorised users
  let history = useHistory();
  const initialState = {
    paginationModel: {
      page: 0,
      pageSize: 25,
    },
    totalRowCount: 0,
    tableData: [],
    tableHeadings: [],
    tableLoading: true,
  };

  const [state, dispatch] = useReducer(logsReducer, initialState);

  useEffect(() => {
    loadLogsController = new AbortController();

    return () => {
      loadLogsController.abort();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadLogs();

    // eslint-disable-next-line
  }, [window.location.pathname]);

  const loadLogs = (paginationModel) => {
    let params = {
      subdomain: appid,
      page_number: state.paginationModel.page + 1,
      limit: state.paginationModel.pageSize,
    };
    if (paginationModel) {
      params.page_number = paginationModel.page + 1;
      params.limit = paginationModel.pageSize;
    }

    api
      .get("/apps/editor/controllers/api-query-metrics", {
        params: params,
        signal: loadLogsController.signal,
      })
      .then((res) => {
        // const data = res.data.data;

        dispatch({
          type: "UPDATE_TABLE",
          data: res.data.data.query_metrics,
          totalRowCount: res.data.data.row_count,
          paginationModel: paginationModel,
        });
      })
      .catch((err) => {
        console.error(err);
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove("session");
            toast.warning(`Please login again`);
            reduxDispatch({ type: "RESET" });
            history.push(`/auth/login?redirect=/apps/${appid}/logs`);
          } else if (err.response.status === 400) {
            toast.error("Error 400 | Bad Request");
          } else if (err.response.status === 404) {
            toast.error("Error 404 | Not Found");
          } else if (err.response.status === 500) {
            toast.error("Error 500 | Internal Server Error");
          }
        }
      });
  };

  // Updates page size and current page
  const paginationModelHandler = (value) => {
    dispatch({
      type: "UPDATE_LOADING_STATUS",
      tableLoading: true,
    });
    loadLogs(value);
  };

  const renderData = () => {
    return (
      <div className="list-deck">
        <div className="loading-div" style={{ width: "100%" }}>
          <Box
            className="data-src-table-bx"
            sx={{
              display: "flex",
              height: "calc(100vh - 160.283px  - 4px - 40px)",
              width: "100%",
            }}
            dir="ltr"
          >
            {/* TODO: serverside  sort and serverside filtering */}
            <DataGridPro
              columns={state.tableHeadings}
              columnVisibilityModel={{
                id: false,
              }}
              density="compact"
              disableRowSelectionOnClick={true}
              getCellClassName={() => "custom-cell"}
              loading={state.tableLoading}
              onPaginationModelChange={paginationModelHandler}
              pagination={true}
              paginationMode="server"
              rowCount={state.totalRowCount}
              paginationModel={state.paginationModel}
              rows={state.tableData}
              pageSizeOptions={[10, 25, 50, 100, 500]}
              // rowThreshold={20}
              sortingMode="client"
              sx={{
                border: "none",
                zIndex: 0,
              }}
              unstable_headerFilters={true}
            />
          </Box>
        </div>
      </div>
    );
  };
  return <>{renderData()}</>;
};

export default Logs;
