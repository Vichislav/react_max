// src/api/greenApi.js

/**
 * Сервисный слой GREEN-API
 * Единая обёртка для SendMessage / ReceiveNotification / DeleteNotification
 */

// При необходимости скорректируйте baseUrl под ваш тип инстанса
// Для WhatsApp обычно https://api.green-api.com
// Для MAX может быть https://api.green-api.com/v3 и т.п. — смотрите документацию
const DEFAULT_BASE_URL = 'https://api.green-api.com';

function buildUrl({ apiUrl, idInstance, apiTokenInstance, method, receiptId }) {
  const base = (apiUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
  let url = `${base}/waInstance${idInstance}/${method}/${apiTokenInstance}`;
  if (receiptId !== undefined && receiptId !== null) {
    url += `/${receiptId}`;
  }
  return url;
}

/**
 * Отправка текстового сообщения
 * @param {Object} params
 * @param {string} params.idInstance
 * @param {string} params.apiTokenInstance
 * @param {string} [params.apiUrl]
 * @param {string} params.chatId   например "79876543210@c.us"
 * @param {string} params.message
 * @returns {Promise<Object>} обычно содержит idMessage
 */
export async function sendMessage({
  idInstance,
  apiTokenInstance,
  apiUrl,
  chatId,
  message,
}) {
  const url = buildUrl({
    apiUrl,
    idInstance,
    apiTokenInstance,
    method: 'sendMessage',
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chatId, message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendMessage failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Получение одного уведомления (long polling, сервер ждёт до receiveTimeout секунд)
 * Возвращает null, если очередь пуста
 * @param {Object} params
 * @param {string} params.idInstance
 * @param {string} params.apiTokenInstance
 * @param {string} [params.apiUrl]
 * @param {number} [params.receiveTimeout=5]  5–60 секунд
 * @returns {Promise<Object|null>} { receiptId, body } или null
 */
export async function receiveNotification({
  idInstance,
  apiTokenInstance,
  apiUrl,
  receiveTimeout = 5,
}) {
  const url = buildUrl({
    apiUrl,
    idInstance,
    apiTokenInstance,
    method: 'receiveNotification',
  });

  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = `${url}${separator}receiveTimeout=${receiveTimeout}`;

  const response = await fetch(finalUrl, {
    method: 'GET',
  });

  console.log(`[GREEN-API] receiveNotification status: ${response.status}`);

  if (response.status === 408) {
    // Это штатный таймаут long polling — сообщений просто нет
    return null;
  }
  

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ReceiveNotification failed (${response.status}): ${errorText}`
    );
  }

  // В документации указано: при пустой очереди возвращается пустое тело, считаем это null
  const text = await response.text();
  if (!text || text.trim() === '') {
    return null;
  }

  return JSON.parse(text);
}

/**
 * Удаление обработанного уведомления (подтверждение получения)
 * @param {Object} params
 * @param {string} params.idInstance
 * @param {string} params.apiTokenInstance
 * @param {string} [params.apiUrl]
 * @param {number|string} params.receiptId  берётся из возврата receiveNotification
 * @returns {Promise<{ result: boolean, reason?: string }>}
 */
export async function deleteNotification({
  idInstance,
  apiTokenInstance,
  apiUrl,
  receiptId,
}) {
  const url = buildUrl({
    apiUrl,
    idInstance,
    apiTokenInstance,
    method: 'deleteNotification',
    receiptId,
  });

  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `DeleteNotification failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
}