const users = []

const addUser = ({ id, username, room }) => {
    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required'
        }
    }

    // Check for duplicate username
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // Validate username
    if (existingUser) {
        return {
            error: 'Username is taken!'
        }
    }

    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => {
        return user.id === id
    })
}

const getUsersInRoom = (room) => {
    return users.filter((user) => {
        return user.room === room
    })
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}

// Some usage examples

// addUser({
//     id: 22,
//     username: 'Clem',
//     room: 'fun'
// })

// addUser({
//     id: 23,
//     username: 'Violet',
//     room: 'fun'
// })

// addUser({
//     id: 24,
//     username: 'Clem',
//     room: 'boring stuff'
// })

// console.log(users)

// // const removedUser = removeUser(22)

// // console.log('remove...')
// // console.log(removedUser)
// // console.log(users)

// console.log('getUser...')
// console.log(getUser(23))

// console.log('getUsersInRoom...')
// console.log(getUsersInRoom('dffdg'))