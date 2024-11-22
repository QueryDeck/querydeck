const setupRepoReducer = (state, action) => {
  switch (action.type) {
    // Initiates loading
    case "START_LOADING":
      return {
        ...state,
        loading: true,
      };

    case "UPDATE_REPO_LIST":
      const repoList = [] ; 
      action.repoData.forEach(element => {
        repoList.push({
          label: element.full_name,
          value: element.full_name,
        })
       });
       let selectedRepo = null; 
       if(repoList.length === 1){ 
        selectedRepo = repoList[0]
       }
      return {
        ...state,
        loading:false,
        repoList,
        selectedRepo,
      };
    // Updates a single field
    case "SINGLE":
      return {
        ...state,
        [action.field]: action.payload,
      };

    case "UPDATE_ATTRIBUTE":
      return {
        ...state,
        [action.field]: action.value,
      };

    default:
      throw new Error(
        `Unknown action type in setupRepoReducer: ${action.type}`
      );
  }
};

export default setupRepoReducer;
