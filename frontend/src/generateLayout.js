const generateLayout = (breakpoint, queries) => {
    const generatedLayout = []
    for (let i = 0; i < queries.length; i++) {
        const y = Math.ceil(Math.random() * 4) + 1
        const queryLayout = {
            y: Math.floor(i / 6) * y,
            minW: 4,
            minH: 6,
            maxH: 20,
            w: 4,
            h: 6,
            i: queries[i].query_id,
            attributes: queries[i].attributes,
            chartTypes: queries[i].chartTypes,
            created_at: queries[i].created_at,
            name: queries[i].name,
            query_id: queries[i].query_id,
            method: queries[i].method
        }
        switch(breakpoint) {
            case 'lg':
            generatedLayout.push({
                ...queryLayout,
                x: (i * 4) % 12,
                maxW: 12,
            })
            break
        case 'md':
            generatedLayout.push({
                ...queryLayout,
                x: (i * 4) % 10,
                maxW: 10,
            })
            break
        case 'sm':
            generatedLayout.push({
                ...queryLayout,
                x: (i * 4) % 8,
                maxW: 8,
            })
            break
        case 'xs':
            generatedLayout.push({
                ...queryLayout,
                x: (i * 4) % 6,
                maxW: 6,
            })
            break
        case 'xxs':
            generatedLayout.push({
                ...queryLayout,
                x: (i * 4) % 4,
                maxW: 4,
            })
            break
        default:
            throw new Error(`Unknown breakpoint in generateLayout: ${breakpoint}`)
        }
    }
    return generatedLayout
}

export default generateLayout