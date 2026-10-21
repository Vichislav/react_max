import { useEffect, useRef } from 'react';

/**
 * Лента сообщений текущего диалога.
 *
 * @param {Object} props
 * @param {Array<{
 *   id: string,
 *   text: string,
 *   direction: 'incoming' | 'outgoing',
 *   timestamp?: number,
 *   status?: 'sent' | 'error'
 * }>} props.messages
 *        Сообщения в порядке отображения (старые сверху, новые снизу).
 * @param {string} [props.emptyText]
 *        Текст заглушки, если сообщений нет.
 */
export default function MessageList({
  messages,
  emptyText = 'Сообщений пока нет. Напишите первым.',
}) {
  const bottomRef = useRef(null);

  // Автоскролл вниз при появлении новых сообщений
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
      <ul className="flex flex-col gap-2">
        {messages.map((msg) => {
          const isOutgoing = msg.direction === 'outgoing';
          const isError = msg.status === 'error';

          return (
            <li
              key={msg.id}
              className={[
                'flex',
                isOutgoing ? 'justify-end' : 'justify-start',
              ].join(' ')}
            >
              <div
                className={[
                  'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                  isOutgoing
                    ? 'rounded-br-sm bg-green-600 text-white'
                    : 'rounded-bl-sm bg-white text-gray-900',
                  isError ? 'border border-red-300' : '',
                ].join(' ')}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.text}
                </div>
                <div
                  className={[
                    'mt-1 flex items-center justify-end gap-1 text-[11px]',
                    isOutgoing ? 'text-green-100' : 'text-gray-400',
                  ].join(' ')}
                >
                  {msg.timestamp && <span>{formatTime(msg.timestamp)}</span>}
                  {isOutgoing && (
                    <span title={isError ? 'Не отправлено' : 'Отправлено'}>
                      {isError ? '⚠' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
}

/**
 * Форматирует timestamp в HH:MM.
 * GREEN-API отдаёт timestamp в секундах, поэтому умножаем на 1000.
 *
 * @param {number} timestamp
 * @returns {string}
 */
function formatTime(timestamp) {
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}