// let showSystemHeaders = false

export const hasData = {
    query: function(data) {
        return data && !(Object.keys(data).length === 0) && data[0] !== ''
    },
    body: function(data) {
        if (data && !(Object.keys(data).length === 0)) {
            let dataType = data.mode;
            if (data[dataType] != "" ) {
                return true
            } else {
                return false
            }
        }
    },
    header: function(data,showSystemHeaders) {
        if (data.hasOwnProperty('system')) {
            return showSystemHeaders && data && data.length > 0
        }
        else {
            return data && data.length > 0
        }
    }
}

export const doubleParse = function(data) {
    return JSON.parse(JSON.stringify(data))
}