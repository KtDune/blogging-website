const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

export const getDay = (timestamp) => {

    const date = new Date(timestamp)

    return `${date.getDate()} ${month[date.getMonth()]}`

}

export const getHomeDate = (timestamp) => {
    const date = new Date(timestamp)

    return `${days[date.getDay()]}, ${date.getDate()} ${month[date.getMonth()]} ${date.getFullYear()}`
}

export const getTime = (dateObj) => {

    if (!(dateObj instanceof Date) || isNaN(dateObj)) {
        console.error('Invalid date object provided');
    }

    const hours = dateObj.getHours();

    if (hours >= 6 && hours <= 11) {
        return 'morning';
    }
    else if (hours >= 12 && hours <= 17) {
        return 'afternoon';
    }
    else {
        return 'night'
    }

}