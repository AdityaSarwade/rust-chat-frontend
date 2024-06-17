import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './reset.css'; // Copy reset.css to public folder
import './style.css'; // Copy style.css to src folder

function App() {
    const [rooms, setRooms] = useState({});
    const [room, setRoom] = useState('ChatRoom 1');
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Simulating initial room setup
        addRoom('ChatRoom 1');
        addRoom('ChatRoom 2');
        changeRoom('ChatRoom 1');
        addMessage('ChatRoom 1', 'Assistant', 'Hey! Open another browser tab, send a message.', true);
        addMessage('ChatRoom 2', 'Assistant', 'This is another room. Create your own too!', true);

        // Subscribe to server-sent events
        subscribe('http://localhost:8000/events');

        // Cleanup function
        return () => {
            // Clean up any subscriptions if necessary
        };
    }, []);

    function hashColor(str) {
        // Function to generate hash color
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }
        return `hsl(${hash % 360}, 100%, 70%)`;
    }

    function addRoom(name) {
        // Function to add a new room
        if (rooms[name]) {
            changeRoom(name);
            return false;
        }

        setRooms(prevRooms => ({
            ...prevRooms,
            [name]: []
        }));
        changeRoom(name);
        return true;
    }

    function changeRoom(name) {
        // Function to change the current room
        if (room === name) return;

        setRoom(name);
    }

    function addMessage(room, username, message, push = false) {
        // Function to add a new message
        if (push) {
            setRooms(prevRooms => ({
                ...prevRooms,
                [room]: [...prevRooms[room], { username, message }]
            }));
        }
    }

    function subscribe(uri) {
        // Function to subscribe to server-sent events
        let events = new EventSource(uri);

        events.onmessage = (ev) => {
            const msg = JSON.parse(ev.data);
            if (!msg.message || !msg.room || !msg.username) return;
            addMessage(msg.room, msg.username, msg.message, true);
        };

        events.onopen = () => {
            setConnected(true);
            console.log(`connected to event stream at ${uri}`);
        };

        events.onerror = () => {
            setConnected(false);
            events.close();
            console.log(`connection lost. attempting to reconnect`);
            // Implement reconnect logic if needed
        };
    }

    function handleSubmitNewMessage(e) {
        // Handle submission of new message form
        e.preventDefault();

        const message = e.target.message.value;
        const username = e.target.username.value || 'guest';

        if (!message || !username) return;

        if (connected) {
            fetch('http://localhost:8000/message', {
                method: 'POST',
                body: new URLSearchParams({ room, username, message }),
            }).then((response) => {
                if (response.ok) e.target.message.value = '';
            });
        }
    }

    function handleSubmitNewRoom(e) {
        // Handle submission of new room form
        e.preventDefault();

        const roomName = e.target.name.value;
        if (!roomName) return;

        e.target.name.value = '';
        if (!addRoom(roomName)) return;

        addMessage(roomName, 'Assistant', `Look, your own "${roomName}" room! Nice.`, true);
    }

    return (
        <div className="App">
            <main>
                <div id="sidebar">
                    <div id="status" className={connected ? 'connected' : 'reconnecting'}></div>

                    <div id="room-list">
                        {Object.keys(rooms).map((roomName) => (
                            <button
                                key={roomName}
                                className={`room ${room === roomName ? 'active' : ''}`}
                                onClick={() => changeRoom(roomName)}
                            >
                                {roomName}
                            </button>
                        ))}
                    </div>

                    <form id="new-room" onSubmit={handleSubmitNewRoom}>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            autoComplete="off"
                            placeholder="new room..."
                            maxLength="29"
                        />
                        <button type="submit">+</button>
                    </form>
                </div>

                <div id="content">
                    <div id="messages">
                        {rooms[room] && rooms[room].map((msg, index) => (
                            <div key={index} className="message">
                                <span className="username" style={{ color: hashColor(msg.username) }}>{msg.username}</span>
                                <span className="text">{msg.message}</span>
                            </div>
                        ))}
                    </div>

                    <form id="new-message" onSubmit={handleSubmitNewMessage}>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            maxLength="19"
                            placeholder="guest"
                            autoComplete="off"
                        />
                        <input
                            type="text"
                            name="message"
                            id="message"
                            autoComplete="off"
                            placeholder="Send a message..."
                            autoFocus
                        />
                        <button type="submit" id="send">Send</button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default App;
