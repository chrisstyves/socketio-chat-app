const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()

// need this for socket.io init.
// normally, express sets up the http server for us behind the scenes
const server = http.createServer(app)

// socket.io needs the raw http server
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    // generateMessage() just a convenience routine
    // socket.emit('message', generateMessage('Welcome!'))

    // sends to all except the one connection
    // socket.broadcast.emit('message', generateMessage('A new user joined'))

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('ADMIN', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        if (!user) {
            return callback('User not found')
        }
        
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed! Shame!')
        }

        console.log(message)
        
        // this would send the message only to the one connection that sent it
        // socket.emit('message', message)

        // this sends the message to all connections
        // io.emit('message', generateMessage(message))

        // this sends the message to all connections in that room
        io.to(user.room).emit('message', generateMessage(user.username, message))

        // used for acknowledgements
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)

        if (!user) {
            return callback('User not found')
        }

        io.to(user.room).emit('locationMessage', 
            generateLocMessage(user.username, 
                `https://google.com/maps?q=${location.latitude},${location.longitude}`))

        callback()
    })

    // 'disconnect' is built in to the library
    // this runs when a client has disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

// start the server
server.listen(port, () => {
    console.log('Web server up and running on port ' + port + '.')
})