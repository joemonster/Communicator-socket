/**
 * STRONA CZATU
 *
 * Główna strona aplikacji po zalogowaniu.
 * Wyświetla historię wiadomości, pole do wpisywania i listę użytkowników online.
 *
 * Funkcje:
 * - Emoji picker - wybór emoji
 * - Relative timestamps - "2 minuty temu"
 * - Typing indicator - "Mama pisze..."
 * - Browser notifications - powiadomienia systemowe
 * - Message reactions - reakcje na wiadomości
 * - Image upload - wysyłanie obrazków
 * - Load older messages - ładowanie starszych wiadomości
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  initSocket,
  sendMessage,
  onSocketEvent,
  offSocketEvent,
  disconnectSocket,
  getSocket
} from '../lib/socket';
import styles from '../styles/Chat.module.css';

// Popularne emoji do wyboru
const EMOJI_LIST = [
  '😀', '😂', '😊', '🥰', '😍', '🤔', '😎', '🥳',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔',
  '🎉', '🎊', '🎁', '🔥', '⭐', '✨', '💯', '🏠'
];

// Reakcje dostępne dla wiadomości
const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [activeReactionMenu, setActiveReactionMenu] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [reactionMenuPosition, setReactionMenuPosition] = useState('top'); // 'top' lub 'bottom'

  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessagesCount = useRef(0);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const emojiPickerRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Sprawdź sesję i inicjalizuj socket przy załadowaniu
  useEffect(() => {
    checkSession();
    requestNotificationPermission();

    // Zamknij emoji picker po kliknięciu poza nim
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      // Zamknij menu reakcji
      if (!event.target.closest(`.${styles.reactionMenu}`) &&
          !event.target.closest(`.${styles.reactionButton}`)) {
        setActiveReactionMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      disconnectSocket();
    };
  }, []);

  // Auto-scroll do ostatniej wiadomości
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(isInitialLoad.current);
      isInitialLoad.current = false;
    }
  }, [messages]);

  // Poproś o zgodę na powiadomienia
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Pokaż powiadomienie systemowe
  function showBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Nie pokazuj powiadomień gdy okno jest aktywne
      if (document.hasFocus()) return;

      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'chat-message'
      });
    }
  }

  // Sprawdź sesję użytkownika
  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.success) {
        setCurrentUser(data.user);
        initializeSocket(data.user.id);
      } else {
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

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('chat:history', (history) => {
      setMessages(history);
      previousMessagesCount.current = history.length;
    });

    socket.on('chat:message', (message) => {
      setMessages((prev) => {
        const newMessages = [...prev, message];

        if (message.userId !== userId && prev.length > 0) {
          playNotificationSound();
          const notificationText = message.type === 'image'
            ? 'wysłał obrazek'
            : message.text?.substring(0, 100) || '';
          showBrowserNotification(
            `${message.userName}`,
            notificationText
          );
        }

        return newMessages;
      });
    });

    // Obsługa starszych wiadomości
    socket.on('chat:olderMessages', (data) => {
      setMessages((prev) => [...data.messages, ...prev]);
      setHasOlderMessages(data.hasMore);
      setLoadingOlder(false);
    });

    socket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    // Obsługa wskaźnika pisania
    socket.on('user:typing', (data) => {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          // Dodaj użytkownika do listy piszących
          if (!prev.find(u => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, userName: data.userName }];
          }
        } else {
          // Usuń użytkownika z listy piszących
          return prev.filter(u => u.userId !== data.userId);
        }
        return prev;
      });
    });

    // Obsługa reakcji na wiadomości
    socket.on('message:reaction', (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId) {
            return { ...msg, reactions: data.reactions };
          }
          return msg;
        })
      );
    });
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

  // Wysyłanie informacji o pisaniu z debounce
  function handleTyping() {
    const socket = getSocket();
    if (!socket) return;

    // Wyślij "zaczął pisać" jeśli jeszcze nie wysłaliśmy
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('chat:typing', true);
    }

    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Po 2 sekundach bez pisania, wyślij "przestał pisać"
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('chat:typing', false);
    }, 2000);
  }

  // Obsługa zmiany tekstu
  function handleInputChange(e) {
    setInputText(e.target.value);
    handleTyping();
  }

  // Wysłanie wiadomości
  function handleSendMessage(e) {
    e.preventDefault();

    if (!inputText.trim() || !isConnected) {
      return;
    }

    // Wyczyść status pisania
    const socket = getSocket();
    if (socket && isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('chat:typing', false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendMessage(inputText);
    setInputText('');
    setShowEmojiPicker(false);
  }

  // Dodaj emoji do tekstu
  function handleEmojiClick(emoji) {
    setInputText((prev) => prev + emoji);
  }

  // Dodaj reakcję do wiadomości
  function handleAddReaction(messageId, emoji) {
    const socket = getSocket();
    if (socket && currentUser) {
      socket.emit('message:reaction', {
        messageId,
        emoji,
        userId: currentUser.id,
        userName: currentUser.name
      });
    }
    setActiveReactionMenu(null);
  }

  // Obsługa wyboru obrazka
  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Sprawdź typ pliku
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Dozwolone tylko obrazki: JPG, PNG, GIF, WebP');
      return;
    }

    // Sprawdź rozmiar (25 MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('Maksymalny rozmiar pliku to 25 MB');
      return;
    }

    setSelectedImage(file);

    // Utwórz preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  // Anuluj wybór obrazka
  function cancelImageSelection() {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Wyślij obrazek
  async function handleSendImage() {
    if (!selectedImage || !isConnected || uploading) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Wyślij wiadomość z załącznikiem
        const socket = getSocket();
        if (socket) {
          socket.emit('chat:message', {
            attachmentId: data.attachment.id
          });
        }

        cancelImageSelection();
      } else {
        alert(data.error || 'Błąd podczas wysyłania obrazka');
      }
    } catch (err) {
      console.error('Błąd uploadu:', err);
      alert('Nie udało się wysłać obrazka');
    } finally {
      setUploading(false);
    }
  }

  // Załaduj starsze wiadomości
  function loadOlderMessages() {
    if (loadingOlder || !hasOlderMessages || messages.length === 0) return;

    setLoadingOlder(true);
    const socket = getSocket();
    if (socket) {
      socket.emit('chat:loadOlder', {
        beforeDate: messages[0].createdAt,
        limit: 50
      });
    }
  }

  // Scroll do ostatniej wiadomości
  function scrollToBottom(instant = false) {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? 'instant' : 'smooth'
    });
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

  // Formatuj czas względny ("2 minuty temu")
  function formatRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 30) {
      return 'przed chwilą';
    } else if (diffInSeconds < 60) {
      return `${diffInSeconds} sek. temu`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      if (minutes === 1) return 'minutę temu';
      if (minutes < 5) return `${minutes} minuty temu`;
      return `${minutes} minut temu`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      if (hours === 1) return 'godzinę temu';
      if (hours < 5) return `${hours} godziny temu`;
      return `${hours} godzin temu`;
    } else {
      // Ponad 24h - pokaż datę
      return date.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  // Sprawdź, czy wiadomość jest od aktualnego użytkownika
  function isOwnMessage(message) {
    return currentUser && message.userId === currentUser.id;
  }

  // Renderuj reakcje na wiadomości
  function renderReactions(message) {
    if (!message.reactions || Object.keys(message.reactions).length === 0) {
      return null;
    }

    return (
      <div className={styles.reactions}>
        {Object.entries(message.reactions).map(([emoji, users]) => (
          <span
            key={emoji}
            className={`${styles.reactionBadge} ${
              users.includes(currentUser?.id) ? styles.reactionOwn : ''
            }`}
            onClick={() => handleAddReaction(message.id, emoji)}
            title={users.map(u =>
              onlineUsers.find(ou => ou.userId === u)?.userName || u
            ).join(', ')}
          >
            {emoji} {users.length}
          </span>
        ))}
      </div>
    );
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
                {typingUsers.find(u => u.userId === user.userId) && (
                  <span className={styles.typingBadge}>pisze...</span>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* Obszar czatu */}
        <div className={styles.chatArea}>
          {/* Lista wiadomości */}
          <div className={styles.messagesContainer} ref={messagesContainerRef}>
            <div className={styles.messagesInner}>
            {/* Przycisk ładowania starszych wiadomości */}
            {hasOlderMessages && messages.length > 0 && (
              <div className={styles.loadOlderWrapper}>
                <button
                  className={styles.loadOlderButton}
                  onClick={loadOlderMessages}
                  disabled={loadingOlder}
                >
                  {loadingOlder ? 'Ładowanie...' : 'Załaduj starsze wiadomości'}
                </button>
              </div>
            )}

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
                      } ${message.type === 'image' ? styles.bubbleImage : ''}`}
                    >
                      {/* Treść wiadomości - tekst lub obrazek */}
                      {message.type === 'image' && message.attachment ? (
                        <div
                          className={styles.messageImage}
                          onClick={() => setLightboxImage(`/api/attachments/${message.attachment.id}`)}
                        >
                          <img
                            src={`/api/attachments/${message.attachment.id}`}
                            alt={message.attachment.originalName}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className={styles.messageText}>{message.text}</div>
                      )}
                      <div className={styles.messageTime}>
                        {formatRelativeTime(message.createdAt)}
                      </div>

                      {/* Kontener przycisku reakcji i menu */}
                      <div className={styles.reactionButtonWrapper}>
                        <button
                          className={styles.reactionButton}
                          onClick={(e) => {
                            if (activeReactionMenu === message.id) {
                              setActiveReactionMenu(null);
                            } else {
                              // Sprawdź pozycję przycisku względem viewportu
                              const rect = e.currentTarget.getBoundingClientRect();
                              // Jeśli przycisk jest bliżej niż 100px od góry, pokaż menu poniżej
                              setReactionMenuPosition(rect.top < 100 ? 'bottom' : 'top');
                              setActiveReactionMenu(message.id);
                            }
                          }}
                        >
                          😊
                        </button>

                        {/* Menu reakcji */}
                        {activeReactionMenu === message.id && (
                          <div className={`${styles.reactionMenu} ${reactionMenuPosition === 'bottom' ? styles.reactionMenuBottom : ''}`}>
                            {REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                className={styles.reactionOption}
                                onClick={() => handleAddReaction(message.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Wyświetl reakcje */}
                    {renderReactions(message)}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Wskaźnik pisania */}
          {typingUsers.length > 0 && (
            <div className={styles.typingIndicator}>
              <span className={styles.typingDots}>
                <span></span>
                <span></span>
                <span></span>
              </span>
              {typingUsers.length === 1
                ? `${typingUsers[0].userName} pisze...`
                : `${typingUsers.map(u => u.userName).join(', ')} piszą...`
              }
            </div>
          )}

          {/* Preview wybranego obrazka */}
          {imagePreview && (
            <div className={styles.imagePreview}>
              <img src={imagePreview} alt="Preview" />
              <div className={styles.imagePreviewActions}>
                <button
                  type="button"
                  className={styles.cancelImageButton}
                  onClick={cancelImageSelection}
                  disabled={uploading}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  className={styles.sendImageButton}
                  onClick={handleSendImage}
                  disabled={uploading}
                >
                  {uploading ? 'Wysyłanie...' : 'Wyślij obrazek'}
                </button>
              </div>
            </div>
          )}

          {/* Pole do wpisywania wiadomości */}
          <form onSubmit={handleSendMessage} className={styles.inputForm}>
            {/* Emoji picker */}
            <div className={styles.emojiWrapper} ref={emojiPickerRef}>
              <button
                type="button"
                className={styles.emojiButton}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😊
              </button>

              {showEmojiPicker && (
                <div className={styles.emojiPicker}>
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={styles.emojiOption}
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Przycisk dodawania obrazka */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className={styles.imageButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || uploading}
              title="Dodaj obrazek"
            >
              📷
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
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

      {/* Lightbox dla pełnego rozmiaru obrazka */}
      {lightboxImage && (
        <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxImage(null)}>
            ✕
          </button>
          <img src={lightboxImage} alt="Powiększony obrazek" />
        </div>
      )}
    </div>
  );
}
