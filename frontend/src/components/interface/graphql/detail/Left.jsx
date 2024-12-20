// React imports
import React from "react";
// SCSS module
// import styles from "../graphql.module.scss";

// Library imports
import {
  faSortNumericDown,
  faPlus,
  faTable,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Input, ButtonGroup } from "reactstrap";

const Left = ({
  handleSelectedTable,
  width,
  details,
  openSetupGraphQLModal,
}) => {
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
            // onClick={previewAPI}
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
          // onChange={event => dispatch(filterAPIlist({
          //   search: event.target.value,
          //   subdomain: props.subdomain
          // }))}
          placeholder="Search Table"
          // value={props.search}
        />
        <Button
          color="falcon-primary"
          // onClick={() => dispatch(sortAPIlist({
          //   subdomain: props.subdomain
          // }))}
          size="sm"
        >
          <FontAwesomeIcon icon={faSortNumericDown} />
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
        {details?.tableData?.map((item) => (
          <TableBox key={item.table_name} tableName={item.table_name} />
        ))}
      </div>
    </div>
  );
};

export default Left;
