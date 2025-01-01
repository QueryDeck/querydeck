// React imports
import React from "react";
// SCSS module

// Library imports
import SetupGraphQLModal from "./modal/SetupGraphQLModal";
const SetupGraphQL = ({
  subdomain,
  tableOptions,
  openSetupGraphQLModal,
  closeSetupGraphQLModal,
  setupGraphQLModalState,
  handleSetupGraphQLModalClick,
}) => {
  const renderData = () => {
    return (
      <>
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
