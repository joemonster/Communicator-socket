/**
 * STRONA CZATU
 *
 * Główna strona aplikacji po zalogowaniu.
 * Wyświetla historię wiadomości, pole do wpisywania i listę użytkowników online.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  initSocket,
  sendMessage,
  onSocketEvent,
  offSocketEvent,
  disconnectSocket
} from '../lib/socket';
import styles from '../styles/Chat.module.css';

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const previousMessagesCount = useRef(0);

  // Sprawdź sesję i inicjalizuj socket przy załadowaniu
  useEffect(() => {
    checkSession();

    return () => {
      // Cleanup: rozłącz socket przy opuszczeniu strony
      disconnectSocket();
    };
  }, []);

  // Auto-scroll do ostatniej wiadomości
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sprawdź sesję użytkownika
  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.success) {
        setCurrentUser(data.user);
        initializeSocket(data.user.id);
      } else {
        // Brak sesji, przekieruj do logowania
        router.push('/');
      }
    } catch (err) {
      console.error('Błąd sprawdzania sesji:', err);
      router.push('/');
    }
  }

  // Inicjalizuj Socket.io
  function initializeSocket(userId) {
    const socket = initSocket(userId);

    // Zdarzenie: połączono
    socket.on('connect', () => {
      setIsConnected(true);
    });

    // Zdarzenie: rozłączono
    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Zdarzenie: historia wiadomości (po połączeniu)
    socket.on('chat:history', (history) => {
      setMessages(history);
      previousMessagesCount.current = history.length;
    });

    // Zdarzenie: nowa wiadomość
    socket.on('chat:message', (message) => {
      setMessages((prev) => {
        const newMessages = [...prev, message];

        // Odtwórz dźwięk tylko dla wiadomości od innych użytkowników
        // i tylko jeśli to nie jest ładowanie historii
        if (message.userId !== userId && prev.length > 0) {
          playNotificationSound();
        }

        return newMessages;
      });
    });

    // Zdarzenie: lista użytkowników online
    socket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    // Opcjonalnie: obsługa "user is typing"
    // socket.on('user:typing', (data) => {
    //   console.log(`${data.userName} pisze...`);
    // });
  }

  // Wylogowanie
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      disconnectSocket();
      router.push('/');
    } catch (err) {
      console.error('Błąd wylogowania:', err);
    }
  }

  // Wysłanie wiadomości
  function handleSendMessage(e) {
    e.preventDefault();

    if (!inputText.trim() || !isConnected) {
      return;
    }

    sendMessage(inputText);
    setInputText('');
  }

  // Scroll do ostatniej wiadomości
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // Odtwórz dźwięk powiadomienia
  function playNotificationSound() {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log('Nie można odtworzyć dźwięku:', err);
      });
    }
  }

  // Formatuj czas wiadomości
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Sprawdź, czy wiadomość jest od aktualnego użytkownika
  function isOwnMessage(message) {
    return currentUser && message.userId === currentUser.id;
  }

  if (!currentUser) {
    return (
      <div className={styles.loading}>
        <p>Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Audio element dla powiadomień */}
      <audio ref={audioRef} src="/notification.wav" preload="auto" />

      {/* Górny pasek */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.appName}>🏠 Domowy Czat</h1>
          <div className={styles.connectionStatus}>
            <span className={isConnected ? styles.statusOnline : styles.statusOffline}>
              {isConnected ? '● Online' : '● Offline'}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.currentUser}>
            {currentUser.name}
          </span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Wyloguj
          </button>
        </div>
      </header>

      {/* Główna sekcja */}
      <div className={styles.main}>
        {/* Boczny panel z użytkownikami online */}
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Online ({onlineUsers.length})</h3>
          <ul className={styles.usersList}>
            {onlineUsers.map((user) => (
              <li key={user.userId} className={styles.userItem}>
                <span className={styles.userDot}>●</span>
                {user.userName}
              </li>
            ))}
          </ul>
        </aside>

        {/* Obszar czatu */}
        <div className={styles.chatArea}>
          {/* Lista wiadomości */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>👋 Brak wiadomości. Wyślij pierwszą wiadomość!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = isOwnMessage(message);
                return (
                  <div
                    key={message.id}
                    className={`${styles.messageWrapper} ${
                      isOwn ? styles.messageOwn : styles.messageOther
                    }`}
                  >
                    {!isOwn && (
                      <div className={styles.messageSender}>
                        {message.userName}
                      </div>
                    )}
                    <div
                      className={`${styles.messageBubble} ${
                        isOwn ? styles.bubbleOwn : styles.bubbleOther
                      }`}
                    >
                      <div className={styles.messageText}>{message.text}</div>
                      <div className={styles.messageTime}>
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pole do wpisywania wiadomości */}
          <form onSubmit={handleSendMessage} className={styles.inputForm}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Napisz wiadomość..."
              className={styles.messageInput}
              disabled={!isConnected}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!inputText.trim() || !isConnected}
            >
              Wyślij
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
