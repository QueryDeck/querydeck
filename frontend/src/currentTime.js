const currentTime = () => {
    const currentUNIX = Date.now()
    const delta = new Date(currentUNIX)
    let currentTime = ''
    currentTime = currentTime.concat(delta.getFullYear())
    currentTime = delta.getMonth() < 9 ?
        currentTime.concat(0).concat(delta.getMonth() + 1) :
        currentTime.concat(delta.getMonth() + 1)
    currentTime = delta.getDate() < 10 ?
        currentTime.concat(0).concat(delta.getDate()) :
        currentTime.concat(delta.getDate())
    currentTime = delta.getHours() < 10 ?
        currentTime.concat(0).concat(delta.getHours()) :
        currentTime.concat(delta.getHours())
    currentTime = delta.getMinutes() < 10 ?
        currentTime.concat(0).concat(delta.getMinutes()) :
        currentTime.concat(delta.getMinutes())
    currentTime = delta.getSeconds() < 10 ?
        currentTime.concat(0).concat(delta.getSeconds()) :
        currentTime.concat(delta.getSeconds())
    return currentTime
}

export default currentTime