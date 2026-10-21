import { useCallback, useMemo, useState } from 'react';
import AuthForm from './components/AuthForm';
import ChatList from './components/ChatList';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import { usePolling } from './hooks/usePolling';

export default function App() {
  // Учётные данные: null — пользователь не авторизован
  const [credentials, setCredentials] = useState(null);

  // История всех сообщений (входящих и исходящих) по всем чатам
  const [messages, setMessages] = useState([]);

  // Активный чат (chatId собеседника)
  const [activeChatId, setActiveChatId] = useState(null);

  // Поле ручного ввода chatId (если хочется начать диалог первым)
  const [manualChatId, setManualChatId] = useState('');

  // ---------- Авторизация ----------
  const handleAuthSubmit = useCallback((values) => {
    setCredentials(values);
    setMessages([]);
    setActiveChatId(null);
    setManualChatId('');
  }, []);

  const handleLogout = useCallback(() => {
    setCredentials(null);
    setMessages([]);
    setActiveChatId(null);
    setManualChatId('');
  }, []);

  // ---------- Обработка входящих уведомлений ----------
  const handleNotification = useCallback((body) => {
    if (!body) return;

    const typeWebhook = body.typeWebhook;

    // Нас интересуют только входящие текстовые сообщения
    if (typeWebhook !== 'incomingMessageReceived') return;

    const text =
      body?.messageData?.textMessageData?.textMessage ||
      body?.messageData?.extendedTextMessageData?.text ||
      '';

    if (!text) return;

    const senderChatId = body?.senderData?.chatId;
    if (!senderChatId) return;

    const senderName = body?.senderData?.senderName || senderChatId;

    setMessages((prev) => [
      ...prev,
      {
        id: body?.idMessage || `in-${Date.now()}-${Math.random()}`,
        chatId: senderChatId,
        senderName,
        text,
        direction: 'incoming',
        timestamp: body?.timestamp || Math.floor(Date.now() / 1000),
        status: 'sent',
      },
    ]);

    // Если активный чат ещё не выбран — открываем диалог с отправителем
    setActiveChatId((prev) => prev || senderChatId);
  }, []);

  // ---------- Запуск polling ----------
  usePolling({
    idInstance: credentials?.idInstance ?? null,
    apiTokenInstance: credentials?.apiTokenInstance ?? null,
    onNotification: handleNotification,
    receiveTimeout: 5,
  });

  // ---------- Производные данные ----------
  // Список чатов: группируем сообщения по chatId, последнее сообщение — превью
  const chats = useMemo(() => {
    const map = new Map();

    for (const msg of messages) {
      const prev = map.get(msg.chatId);
      map.set(msg.chatId, {
        chatId: msg.chatId,
        title: msg.senderName || prev?.title || msg.chatId,
        lastMessage: msg.text,
        lastTimestamp: msg.timestamp,
      });
    }

    return Array.from(map.values()).sort(
      (a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0)
    );
  }, [messages]);

  // Сообщения активного чата
  const activeMessages = useMemo(() => {
    if (!activeChatId) return [];
    return messages.filter((m) => m.chatId === activeChatId);
  }, [messages, activeChatId]);

  // ---------- Выбор чата ----------
  const handleSelectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
    setManualChatId('');
  }, []);

  const handleManualChatSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = manualChatId.trim();
      if (!trimmed) return;
      setActiveChatId(trimmed);
      setManualChatId('');
    },
    [manualChatId]
  );

  // ---------- Добавление / обновление исходящего сообщения ----------
  const handleSent = useCallback((msg) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === msg.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = msg;
        return next;
      }
      return [...prev, msg];
    });
  }, []);

  // ---------- Рендер ----------
  if (!credentials) {
    return <AuthForm onSubmit={handleAuthSubmit} />;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Шапка */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="text-sm font-semibold text-gray-900">
          GREEN-API Мессенджер
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>idInstance: {credentials.idInstance}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Основная область */}
      <div className="flex min-h-0 flex-1">
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelect={handleSelectChat}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-white">
          {activeChatId ? (
            <>
              {/* Заголовок активного чата */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {activeChatId}
                  </div>
                </div>
              </div>

              {/* Лента сообщений */}
              <MessageList messages={activeMessages} />

              {/* Поле ввода */}
              <MessageInput
                credentials={credentials}
                chatId={activeChatId}
                onSent={handleSent}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
              <p className="text-sm text-gray-500">
                Выберите чат слева или начните новый диалог.
              </p>
              <form
                onSubmit={handleManualChatSubmit}
                className="flex w-full max-w-md items-center gap-2"
              >
                <input
                  type="text"
                  value={manualChatId}
                  onChange={(e) => setManualChatId(e.target.value)}
                  placeholder="chatId, например 79876543210@c.us"
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
                <button
                  type="submit"
                  disabled={!manualChatId.trim()}
                  className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 active:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Открыть
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}