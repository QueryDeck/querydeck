// React imports
import React from "react";
// SCSS module
import styles from "../graphql.module.scss";

// Library imports

import { Card, Badge, CardBody, CardTitle, CardText } from "reactstrap";

const Right = ({ details, width, openSetupGraphQLModal }) => {
  const relations = details?.selectedTable
    ? details?.tableData?.find(
        (item) => item.table_name === details.selectedTable
      )?.relations
    : null;

  const TableBox = ({ textPath, relationTableName, type }) => {
    return (
      <div>
        <Card className="my-1">
          <CardBody style={{ paddingTop: 8, paddingBottom: 8 }}>
            <CardTitle tag="h7">
              <span style={{ fontSize: "16px" }}> {relationTableName} </span>
            </CardTitle>

            <CardText style={{ marginBottom: "1px" }}>
              <span style={{ fontSize: "15px" }}> Join: </span>
              <Badge className={styles.relationbox_badge}>
                {textPath.split("-").join(" = ")}
              </Badge>
            </CardText>
            <CardText>
              <span style={{ fontSize: "15px" }}> Type: </span>
              <span> {type} </span>[{type === "1-1" ? "object" : "array"}
                &nbsp;relation]
            </CardText>
          </CardBody>
        </Card>
      </div>
    );
  };

  if (details?.initial) {
    return (
      <div className={styles.graphql_empty}>
        <div
          className="enums-list-enum enums-list-enum-create enums-list-enum-empty"
          key="empty"
          onClick={openSetupGraphQLModal}
        >
          Click here to Setup GraphQL
        </div>
      </div>
    );
  }

  if (!relations) {
    return (
      <Card style={{ width, height: "100%" }}>
        <div className="api-saved-details-empty">
          Click on an a Table to view relations
        </div>
      </Card>
    );
  }

  return (
    <div className={styles.right} style={{ width }}>
      <div className={styles.relationbox}>Table Relations</div>
      {relations.length === 0 ? (
        <div style={{ padding: 10 }}>No Relation Exist</div>
      ) : (
        relations?.map((item) => (
          <TableBox
            key={item.relation_name}
            textPath={item.text_path}
            relationTableName={item.rel_table_graphql}
            type={item.type}
          />
        ))
      )}
    </div>
  );
};

export default Right;
