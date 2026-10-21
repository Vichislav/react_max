import { useState } from 'react';
import { sendMessage } from '../api/greenApi';

/**
 * Поле ввода и кнопка отправки сообщения.
 * Сам вызывает sendMessage и сообщает наверх результат через onSent / onError.
 *
 * @param {Object} props
 * @param {{ idInstance: string, apiTokenInstance: string }} props.credentials
 *        Учётные данные GREEN-API (уже провалидированы на форме авторизации).
 * @param {string} props.chatId
 *        Идентификатор собеседника, например "79876543210@c.us".
 * @param {(message: {
 *   id: string,
 *   chatId: string,
 *   text: string,
 *   direction: 'outgoing',
 *   timestamp: number,
 *   status: 'sent' | 'error'
 * }) => void} props.onSent
 *        Колбэк после попытки отправки. Вызывается и при успехе, и при ошибке
 *        (в последнем случае status = 'error').
 */
export default function MessageInput({ credentials, chatId, onSent }) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const canSend = text.trim().length > 0 && !isSending && Boolean(chatId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;

    const trimmed = text.trim();
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = Math.floor(Date.now() / 1000);

    // Оптимистично добавляем сообщение в историю
    onSent({
      id: localId,
      chatId,
      text: trimmed,
      direction: 'outgoing',
      timestamp,
      status: 'sent',
    });

    setText('');
    setIsSending(true);

    try {
      await sendMessage({
        idInstance: credentials.idInstance,
        apiTokenInstance: credentials.apiTokenInstance,
        chatId,
        message: trimmed,
      });
    } catch (err) {
      console.error('SendMessage error:', err);
      // Помечаем сообщение как неотправленное
      onSent({
        id: localId,
        chatId,
        text: trimmed,
        direction: 'outgoing',
        timestamp,
        status: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // Enter отправляет, Shift+Enter — перенос строки
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-gray-200 bg-white px-4 py-3"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder={
          chatId
            ? 'Введите сообщение…'
            : 'Сначала выберите чат или укажите chatId'
        }
        disabled={!chatId || isSending}
        className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100 disabled:text-gray-400"
      />
      <button
        type="submit"
        disabled={!canSend}
        className="h-[42px] shrink-0 rounded-xl bg-green-700 px-4 text-sm font-semibold text-white transition hover:bg-green-800 active:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isSending ? '…' : 'Отправить'}
      </button>
    </form>
  );
}