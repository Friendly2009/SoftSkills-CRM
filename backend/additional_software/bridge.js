const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const REMOTE_URL =""; // <=== LOOK AT DOTENV :)
const LOCAL_URL = ""; // <===//

async function poll() {
  try {
    const res = await fetch(REMOTE_URL);
    if (!res.ok) {
      console.log(`[Сервер] Ошибка опроса хостинга. Статус: ${res.status}`);
      setTimeout(poll, 1000);
      return;
    }

    const requests = await res.json();

    const promises = Object.entries(requests).map(async ([id, req]) => {
      const reqId = id.replace("req_", "");
      console.log(`[Мост] Новый запрос с сервера: ID=${reqId}, URI=${req.uri}`);

      const cleanHeaders = { ...req.headers };
      delete cleanHeaders["host"];
      delete cleanHeaders["Host"];

      try {
        const fetchOptions = {
          method: req.method,
          headers: cleanHeaders,
        };

        if (req.method !== "GET" && req.body) {
          fetchOptions.body =
            typeof req.body === "object" ? JSON.stringify(req.body) : req.body;
        }

        console.log(
          `[Локал] Отправляю на локальный сервер: ${LOCAL_URL}${req.uri}`,
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        fetchOptions.signal = controller.signal;

        const localRes = await fetch(LOCAL_URL + req.uri, fetchOptions);
        clearTimeout(timeoutId);
        clearTimeout(timeoutId);

        const localBody = await localRes.text();
        console.log(`[Локал] Ответ получен. Статус: ${localRes.status}`);

        const contentType =
          localRes.headers.get("content-type") || "application/json";

        const postRes = await fetch(REMOTE_URL, {
          method: "POST",
          headers: {
            "X-Response-ID": reqId,
            "X-Response-Code": String(localRes.status),
            "Content-Type": contentType,
          },
          body: localBody,
        });
        console.log(
          `[Сервер] Ответ передан на хостинг. Статус: ${postRes.status}`,
        );
      } catch (err) {
        console.error(
          `[Ошибка] Проблема обработки локального запроса: ${err.message}`,
        );

        await fetch(REMOTE_URL, {
          method: "POST",
          headers: {
            "X-Response-ID": reqId,
            "X-Response-Code": "500",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: false,
            error: err.message,
            note: "Локальный сервер не ответил",
          }),
        });
      }
    });

    await Promise.all(promises);
  } catch (e) {
    console.error("[Критическая ошибка моста]:");
    console.error(e);
  }

  setTimeout(poll, 1500);
}
console.log("Диагностический мониторинг запущен. Ожидание запросов...");
poll();