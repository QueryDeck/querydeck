// React imports
import React from "react";

// Library imports
import { 
  Card, 
  Badge, 
  CardBody, 
  CardTitle, 
  CardText,
} from "reactstrap";
import { toast } from 'react-toastify';

// SCSS module
import styles from "../graphql.module.scss";

// API
import { apiBase } from '../../../../api';

const Right = ({ details, width, openSetupGraphQLModal  ,subdomain}) => {
  const relations = details?.selectedTable
    ? details?.tableData?.find(
        (item) => item.table_name === details.selectedTable
      )?.relations
    : null;

  const copyAPI = () => {
    navigator.clipboard.writeText(`https://${subdomain}.${apiBase}${'/graphql'}`).then(() => {
      toast.success('API copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  const getBadgeData = (status = null) => {
    if (details?.method === 'insert' || status === 200) {
      return ({
        badge: styles.badge_success,
        heading: styles.script_heading_success,
        method: 'POST'
      })
    } else if (details?.method === 'update' || status === 300) {
      return ({
        badge: styles.badge_warning,
        heading: styles.script_heading_warning,
        method: 'PUT'
      })
    } else if (details?.method === 'delete' || status === 400) {
      return ({
        badge: styles.badge_danger,
        heading: styles.script_heading_danger,
        method: 'DELETE'
      })
    } else {
      return ({
        badge: styles.badge_primary,
        heading: styles.script_heading_primary,
        method: 'GET'
      })
    }
  }

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

  const badgeData = getBadgeData(200);
  return (
    <div className={styles.right} style={{ width }}>
      <div className={styles.relationbox}> 
        <span> Table Relations </span>
        <div className={styles.script}>
          <div
            className={badgeData?.heading}
            onClick={copyAPI}
          >
            <Badge className={badgeData?.badge}>
              {badgeData?.method}
            </Badge>
            <span>
              https://{subdomain}.{apiBase}{'/graphql'}
            </span>
          </div>
        </div>
      </div>
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
