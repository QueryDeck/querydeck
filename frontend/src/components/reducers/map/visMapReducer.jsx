const visMapReducer = (state, action) => {
    switch(action.type) {
        case 'UPDATE_GRAPH':
            return {
                ...state,
                graph: {
                    edges: action.edges,
                    loading: false,
                    nodes: action.nodes
                }
            }
        case 'UPDATE_EDGES':
            return {
                ...state,
                graph: {
                    ...state.graph,
                    loading: false,
                    edges: action.edges
                }
            }
        case 'UPDATE_NODES':
            return {
                ...state,
                graph: {
                    ...state.graph,
                    loading: false,
                    nodes: action.nodes
                }
            }
        default:
            throw new Error(`Unknown action type in visMapReducer: ${action.type}`)
    }
}

export default visMapReducer