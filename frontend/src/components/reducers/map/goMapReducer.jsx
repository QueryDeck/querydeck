const goMapReducer = (state, action) => {
    switch(action.type) {
        case 'UPDATE_GRAPH':
            return {
                ...state,
                links: action.links,
                loading: false,
                nodes: action.nodes
            }
        default:
            throw new Error(`Unknown action type in goMapReducer: ${action.type}`)
    }
}

export default goMapReducer