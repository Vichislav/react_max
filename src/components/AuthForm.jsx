
import { useState } from 'react';

/**
 * Форма авторизации в GREEN-API.
 * Собирает idInstance и apiTokenInstance и передаёт их наверх.
 *
 * @param {Object} props
 * @param {(values: { idInstance: string, apiTokenInstance: string }) => void} props.onSubmit
 */
export default function AuthForm({ onSubmit }) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedId = idInstance.trim();
    const trimmedToken = apiTokenInstance.trim();

    if (!trimmedId || !trimmedToken) {
      setError('Заполните оба поля: idInstance и apiTokenInstance.');
      return;
    }

    // idInstance в GREEN-API — числовой идентификатор
    if (!/^\d+$/.test(trimmedId)) {
      setError('idInstance должен состоять только из цифр.');
      return;
    }

    setError('');
    onSubmit({
      idInstance: trimmedId,
      apiTokenInstance: trimmedToken,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3.5 rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 className="m-0 text-xl font-semibold text-gray-900">
          Вход в GREEN-API
        </h2>
        <p className="m-0 text-sm text-gray-500">
          Данные можно найти в личном кабинете GREEN-API на странице вашего инстанса.
        </p>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          idInstance
          <input
            type="text"
            inputMode="numeric"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="например 1101000001"
            autoComplete="off"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          apiTokenInstance
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="вставьте токен инстанса"
            autoComplete="off"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          className="rounded-lg bg-green-700 px-3 py-2.5 text-[15px] font-semibold text-white transition hover:bg-green-800 active:bg-green-900"
        >
          Войти
        </button>
      </form>
    </div>
  );
}