const getFullMonth = (month, shorten) => {
    let result = ''
    switch(month) {
        case 0:
            result = 'January'
            break
        case 1:
            result = 'February'
            break
        case 2:
            result = 'March'
            break
        case 3:
            result = 'April'
            break
        case 4:
            result = 'May'
            break
        case 5:
            result = 'June'
            break
        case 6:
            result = 'July'
            break
        case 7:
            result = 'August'
            break
        case 8:
            result = 'September'
            break
        case 9:
            result = 'October'
            break
        case 10:
            result = 'November'
            break
        case 11:
            result = 'December'
            break
        default:
            console.error(`Incorrect month: ${month}`)
            result = month
            break
    }
    if(shorten) {
        return result.slice(0,3)
    } else {
        return result
    }
}

const timeCalculator = (rawTime, recent = true) => {
    if(recent) {
        const currentUNIX = Date.now()
        const delta = new Date(currentUNIX - rawTime * 1000)
        if(delta.getUTCFullYear() === 1970) {
            if(delta.getUTCMonth() === 0) {
                if(delta.getUTCDate() === 1) {
                    if(delta.getUTCHours() === 0) {
                        if(delta.getUTCMinutes() === 0) {
                            return `${delta.getUTCSeconds()} secs ago`
                        } else if(delta.getUTCMinutes() === 1) {
                            return `A min ago`
                        } else {
                            // return Mins diff
                            return `${delta.getUTCMinutes()} mins ago`
                        }
                    } else if(delta.getUTCHours() === 1) {
                        return 'An hour ago'
                    } else {
                        // return Hours diff
                        return `${delta.getUTCHours()} hours ago`
                    }
                } else {
                    // return Days diff
                    if(delta.getUTCDate() === 2) {
                        return `Yesterday`
                    } else {
                        return `${delta.getUTCDate() - 1} days ago`
                    }
                }
            } else {
                // return Months diff
                if(delta.getUTCMonth() === 1) {
                    return `Last month`
                } else {
                    return `${delta.getUTCMonth()} months ago`
                }
            }
        } else {
            // return Years diff
            if(delta.getUTCFullYear() === 1971) {
                return `Last year`
            } else {
                if(delta.getUTCFullYear() - 1970 < 0) {
                    return 'Just Now'
                } else {
                    return `${delta.getUTCFullYear() - 1970} years ago`
                }
            }
        }
    } else {
        const eventTime = new Date(rawTime * 1000)
        return `${eventTime.getHours() / 10 < 1 ? `0${eventTime.getHours()}` : eventTime.getHours()}:${eventTime.getMinutes() / 10 < 1 ? `0${eventTime.getMinutes()}` : eventTime.getMinutes()}, ${eventTime.getDate() / 10 < 1 ? `0${eventTime.getDate()}` : eventTime.getDate()} ${getFullMonth(eventTime.getMonth(), true)} ${eventTime.getFullYear()}`
    }
}

export default timeCalculator