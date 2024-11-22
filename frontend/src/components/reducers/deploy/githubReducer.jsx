const githubReducer = (state, action) => {
  switch (action.type) {
    // Initiates loading
    case "START_LOADING":
      return {
        ...state,
        loading: true,
      };
    // Set github status
    case "SET_GITHUB_STATUS":
      return {
        ...state,
        loading: action.loading || false,
        githubStatus: action.githubStatus,
        repoUrl: action.repoUrl || '',
      };

    // Set github diff
    case "SET_GITHUB_DIFF":
      return {
        ...state,
        // loading: false,
        diff: {
          totalChanges: action.diff?.total_changes || 0,
          text: action.diff?.text || "",
        },
      };

    // Set github diff verbose
    case "SET_GITHUB_DIFF_VERBOSE":
      return {
        ...state,
        loading: false,
        diffVerbose: {
          deleted: action.diffVerbose?.deleted || [],
          added: action.diffVerbose?.added || [],
          modified: action.diffVerbose?.modified || [],
          text: action.diffVerbose?.text || "",
        },
      };

   // Set github commit history 
    case "SET_GITHUB_COMMIT_HISTORY":
      return {
        ...state,
       
        commits:  action.commits  || [] ,
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
      throw new Error(`Unknown action type in githubReducer: ${action.type}`);
  }
};

export default githubReducer;
