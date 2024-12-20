// React imports
import React from "react";
// SCSS module
// import styles from "../graphql.module.scss";

// Library imports

import { useResizable } from "@ag_meq/rrl";

import Left from "./Left";
import Right from "./Right";

const Details = ({ openSetupGraphQLModal, handleSelectedTable, details }) => {
  const { position, separatorProps } = useResizable({
    axis: "x",
    initial: Math.max(400, (window.innerWidth - 4 - 4) / 5),
    max: Math.min(
      window.innerWidth - 4 - 4 - 400,
      (3 * (window.innerWidth - 4 - 4)) / 5
    ),
    min: Math.max(400, (window.innerWidth - 4 - 4) / 5),
  });

  const renderData = () => {
    return (
      <>
        <div>
          <div className="api-saved">
            <Left
              width={position - 48 - 8 - 8}
              handleSelectedTable={handleSelectedTable}
              details={details}
              openSetupGraphQLModal={openSetupGraphQLModal}
            />

            <div
              className="separator separator-horizontal"
              {...separatorProps}
            />
            <div
              style={{
                width: window.innerWidth - 4 - 4 - position,
                maxWidth: "2500px",
              }}
            >
              <Right details={details} />
            </div>
          </div>
        </div>
      </>
    );
  };

  return <div>{renderData()}</div>;
};

export default Details;
