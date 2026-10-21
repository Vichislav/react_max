/**
 * Список чатов (диалогов) в левой колонке.
 *
 * @param {Object} props
 * @param {Array<{ chatId: string, title?: string, lastMessage?: string, lastTimestamp?: number }>} props.chats
 *        Массив диалогов. chatId обязателен, остальное — опционально для отображения.
 * @param {string|null} props.activeChatId
 *        chatId текущего открытого диалога (для подсветки). null — ничего не выбрано.
 * @param {(chatId: string) => void} props.onSelect
 *        Колбэк при клике на чат. Получает chatId выбранного диалога.
 */
export default function ChatList({ chats, activeChatId, onSelect }) {
    if (!chats || chats.length === 0) {
      return (
        <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">
            Чаты
          </div>
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-500">
            Пока нет диалогов.
            <br />
            Отправьте первое сообщение или дождитесь входящего.
          </div>
        </aside>
      );
    }
  
    return (
      <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">
          Чаты
        </div>
  
        <ul className="flex-1 overflow-y-auto">
          {chats.map((chat) => {
            const isActive = chat.chatId === activeChatId;
            const title = chat.title || chat.chatId;
            const preview = chat.lastMessage || 'Нет сообщений';
            const time = chat.lastTimestamp
              ? formatTime(chat.lastTimestamp)
              : '';
  
            return (
              <li key={chat.chatId}>
                <button
                  type="button"
                  onClick={() => onSelect(chat.chatId)}
                  className={[
                    'flex w-full flex-col gap-1 border-b border-gray-100 px-4 py-3 text-left transition',
                    'hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-100',
                    isActive ? 'bg-green-50' : 'bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={[
                        'truncate text-sm font-medium',
                        isActive ? 'text-green-800' : 'text-gray-900',
                      ].join(' ')}
                    >
                      {title}
                    </span>
                    {time && (
                      <span className="shrink-0 text-xs text-gray-400">
                        {time}
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs text-gray-500">
                    {preview}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
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