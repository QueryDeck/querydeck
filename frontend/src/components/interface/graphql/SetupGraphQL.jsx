// React imports
import React from "react";
// SCSS module
import styles from './graphql.module.scss'

// Library imports
import { faWrench } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "reactstrap";
import SetupGraphQLModal from "./modal/SetupGraphQLModal";
import GraphQLLogo from '../../../assets/img/illustrations/graphql.svg'
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

        <div className={styles.setupbutton}>

          <br />
          <div className={styles.setupiconcontainer}  >
            <img unselectable="on" alt={'graph-img'} src={GraphQLLogo} />
          </div>
          <Button block color="falcon-primary" onClick={openSetupGraphQLModal}>
            Setup GraphQL &nbsp; <FontAwesomeIcon icon={faWrench} />
          </Button>

        </div>


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
