const socket = io()

// Commonly used elements. '$' is just a naming convention
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New Message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    // Don't scroll to bottom if user is viewing earlier messages
    if (containerHeight - newMessageHeight <= scrollOffset) {
        // Push to the bottom.
        // If we always pushed to bottom no matter what, the
        // autoscroll method would just be this one line.
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    console.log('Client: Received message: ' + msg.text)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mma')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locMsg) => {
    console.log('Client: Received location: ' + locMsg.url)
    const html = Mustache.render(locationTemplate, {
        username: locMsg.username,
        message: locMsg.url,
        createdAt: moment(locMsg.createdAt).format('h:mma')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// listen for the send message form submission
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    
    // disable the form
    $messageFormButton.setAttribute('disabled', 'disabled')
    
    // a safer way to access the input value. better than querySelector
    // in this case because we gave an explicit name in the html form
    // which can be referenced here.
    const message = e.target.elements.message.value
    
    // 3rd arg is an acknowledgement callback
    socket.emit('sendMessage', message, (error) => {
        // enable the form again
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$locButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser :(')
    }

    // disable the button
    $locButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
        }, () => {
            console.log('Location sent!')

            // re-enable the button (after a delay)
            // I added setTimeout for testing purposes and also as a cooldown
            setTimeout(() => { $locButton.removeAttribute('disabled') }, 3000)
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})