// React imports
import React from "react";
// SCSS module
import styles from "../graphql.module.scss";

// Library imports

import { Card, Badge, CardBody, CardTitle, CardText } from "reactstrap";

const Right = ({ details, width }) => {
  const relations = details?.selectedTable
    ? details?.tableData?.find(
        (item) => item.table_name === details.selectedTable
      )?.relations
    : null;

  const TableBox = ({ textPath, relationTableName }) => {
    return (
      <div>
        <Card className="my-1">
          <CardBody style={{ paddingTop: 8, paddingBottom: 8 }}>
            <CardTitle tag="h7">
              <span style={{ fontSize: "16px" }}> {relationTableName} </span>
            </CardTitle>
            <CardText>
              <span style={{ fontSize: "15px" }}> Join: </span>{" "}
              <Badge className={styles.relationbox_badge}>
                {" "}
                {textPath.split("-").join(" = ")}{" "}
              </Badge>
            </CardText>
          </CardBody>
        </Card>
      </div>
    );
  };

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
            relationTableName={item.rel_table}
          />
        ))
      )}
    </div>
  );
};

export default Right;
