// React imports
import React from "react";
import {
  faSortAlphaUp,
  faSortAlphaDown,
  faTable,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Input, ButtonGroup } from "reactstrap";

const Left = ({
  handleSelectedTable,
  width,
  details,
  openSetupGraphQLModal,
  dispatch
}) => {
  const handleSearch = (event) => {
    dispatch({
      type: "FILTER_TABLES",
      search: event.target.value
    });
  };

  const handleSort = () => {
    dispatch({ type: "SORT_TABLES" });
  };

  const TableBox = ({ tableName }) => {
    return (
      <div
        className={`api-saved-list-item${
          details?.selectedTable === tableName ? "-active" : ""
        }`}
        onClick={() => handleSelectedTable(tableName)}
      >
        <div className="api-saved-list-item-api">
          <div
            className="api-saved-list-item-method"
            style={{ transform: "translateY(1px)" }}
          >
            <span style={{ paddingLeft: "4px", paddingRight: "2px" }}>
              <FontAwesomeIcon icon={faTable} color="#2c7be5" />
            </span>
          </div>
          <div className="api-saved-list-item-route">{tableName}</div>
          <div className="api-saved-list-item-actions">
            <ButtonGroup></ButtonGroup>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width }}>
      <div className="api-saved-list-search" style={{ paddingRight: "2px" }}>
        <Input
          autoFocus
          onChange={handleSearch}
          placeholder="Search Table"
        />
        <Button
          color="falcon-primary"
          onClick={handleSort}
          size="sm"
        >
          <FontAwesomeIcon icon={details?.sort?.order ? faSortAlphaDown : faSortAlphaUp} />
        </Button>
        <Button
          color="falcon-primary"
          onClick={openSetupGraphQLModal}
          size="sm"
        >
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
      <div
        className="api-saved-list"
        style={{ height: "calc(100vh - 170px)", overflowX: "hidden" }}
      >
        {(details?.tableDataFiltered || []).map((item) => (
          <TableBox key={item.table_name} tableName={item.table_name} />
        ))}
      </div>
    </div>
  );
};

export default Left;
