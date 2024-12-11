// React imports
import React from "react";
// SCSS module
import styles from './graphql.module.scss'

// Library imports
import { faWrench } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "reactstrap";
import SetupGraphQLModal from "./modal/SetupGraphQLModal";


const SetupGraphQL = ({
  subdomain,
  tableOptions,
  openSetupGraphQLModal,
  closeSetupGraphQLModal,
  setupGraphQLModalState,
  handleSetupGraphQLModalClick }) => {


  const renderData = () => {


    return (
      <>
        
        <div  className={styles.setupbutton}>
          sds
        <Button block color="primary" onClick={openSetupGraphQLModal}>
          Setup GraphQL &nbsp; <FontAwesomeIcon icon={faWrench} />
        </Button>

        </div>
  
        <div
          style={{
            height:
              "calc(100vh - 4px - 4px - 56px - 4px - 79.8167px - 20px - 20px - 36px - 42px - 40px)",
            overflow: "auto",
            padding: "8px 0",
          }}
        ></div>
        <SetupGraphQLModal

          subdomain={subdomain}
          tableOptions={tableOptions}
          openModal={openSetupGraphQLModal}
          closeModal={closeSetupGraphQLModal}
          modalState={setupGraphQLModalState}
          handleSetupGraphQLModalClick={handleSetupGraphQLModalClick}

        />
      </>
    );

  };

  return <div>{renderData()}</div>;
};

export default SetupGraphQL;
