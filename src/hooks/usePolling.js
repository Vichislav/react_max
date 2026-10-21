// src/hooks/usePolling.js
import { useEffect, useRef } from 'react';
import {
  receiveNotification,
  deleteNotification,
} from '../api/greenApi';

/**
 * Хук для циклического получения входящих уведомлений GREEN-API.
 *
 * @param {Object} params
 * @param {string|null} params.idInstance        - если null, опрос не запускается
 * @param {string|null} params.apiTokenInstance  - если null, опрос не запускается
 * @param {string} [params.apiUrl]
 * @param {(notificationBody: Object) => void} params.onNotification
 *        Колбэк, вызываемый для каждого нового уведомления (после успешного receive).
 * @param {number} [params.receiveTimeout=5]     - сколько секунд сервер держит запрос
 * @param {number} [params.errorDelay=3000]      - пауза перед повтором при ошибке сети
 */
export function usePolling({
  idInstance,
  apiTokenInstance,
  apiUrl,
  onNotification,
  receiveTimeout = 5,
  errorDelay = 3000,
}) {
  // Храним колбэк в ref, чтобы не перезапускать цикл при каждом ре-рендере
  const onNotificationRef = useRef(onNotification);
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  // Флаг для остановки цикла при размонтировании
  const isActiveRef = useRef(true);

  useEffect(() => {
    // Не запускаем опрос, пока не введены учётные данные
    if (!idInstance || !apiTokenInstance) return;

    isActiveRef.current = true;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const poll = async () => {
      while (isActiveRef.current) {
        try {
          const notification = await receiveNotification({
            idInstance,
            apiTokenInstance,
            apiUrl,
            receiveTimeout,
          });

          if (!isActiveRef.current) break;

          // null означает "очередь пуста" — это нормально, просто идём на новый круг
          if (notification) {
            const { receiptId, body } = notification;

            // 1) Отдаём данные в UI
            onNotificationRef.current?.(body);

            // 2) Подтверждаем получение, чтобы уведомление не пришло снова
            try {
              await deleteNotification({
                idInstance,
                apiTokenInstance,
                apiUrl,
                receiptId,
              });
            } catch (deleteErr) {
              // Не роняем цикл из-за ошибки удаления, но логируем
              console.error('DeleteNotification error:', deleteErr);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
          // При ошибке (сеть, неверные токены) ждём и пробуем снова
          await sleep(errorDelay);
        }
      }
    };

    poll();

    // Очистка: при размонтировании или смене токенов останавливаем цикл
    return () => {
      isActiveRef.current = false;
    };
  }, [idInstance, apiTokenInstance, apiUrl, receiveTimeout, errorDelay]);
}