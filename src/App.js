import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import ChatList from './components/ChatList';
import Chat from './components/Chat';
import CreateRoom from './components/CreateRoom';
import { ThemeProvider } from '@emotion/react';
import { baseTheme } from './assets/Theme-variable';
import { UserProvider } from './context/UserContext';

function App() {
  const theme = baseTheme;

  return (
    <ThemeProvider theme={theme}>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/chat/list" element={<ChatList />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/create-room" element={<CreateRoom />} />
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
