import asyncio
import logging
import os
import sys

from aiogram import Bot, Dispatcher, F
from aiogram.types import Message
from dotenv import load_dotenv
import aiomysql

# Создаем собственный логгер, чтобы Ruff не ругался на root logger (LOG015)
logger = logging.getLogger("bot")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("logs.txt", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
try:
    ADMIN_ID = int(os.getenv("ADMIN_ID"))
except (TypeError, ValueError):
    logger.critical(
        "Ошибка: Проверьте ADMIN_ID в .env (должно быть число)"
    )
    raise ValueError(
        "Ошибка: Проверьте ADMIN_ID в .env (должно быть число)"
    )

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
db_pool: aiomysql.Pool | None = None


async def init_db() -> None:
    global db_pool
    logger.info("Подключение к базе данных MySQL...")
    db_pool = await aiomysql.create_pool(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        db=os.getenv("DB_NAME"),
        autocommit=True,
    )
    logger.info("Пул подключений к БД успешно создан.")


async def save_user(
    tg_id: int,
    username: str | None,
    first_name: str | None,
    role: str = "user",
) -> None:
    sql = """
    INSERT INTO tg_users (id, username, first_name, role)
    VALUES (%s, %s, %s, %s)
    AS new_data
    ON DUPLICATE KEY UPDATE
    username = new_data.username, first_name = new_data.first_name
    """
    async with db_pool.acquire() as conn, conn.cursor() as cur:
        await cur.execute(
            sql, (tg_id, username or "", first_name or "", role)
        )


async def log_message(
    tg_user_id: int,
    message_text: str,
    direction: str,
    tg_message_id: int | None = None,
) -> None:
    sql = """
    INSERT INTO tg_messages (tg_user_id, message, direction, tg_message_id)
    VALUES (%s, %s, %s, %s)
    """
    async with db_pool.acquire() as conn, conn.cursor() as cur:
        await cur.execute(
            sql, (tg_user_id, message_text, direction, tg_message_id)
        )


@dp.message(F.text == "/start")
async def cmd_start(message: Message) -> None:
    uid = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name

    logger.info(f"Пользователь {uid} (@{username}) нажал /start")

    if uid == ADMIN_ID:
        await save_user(uid, username, first_name, role="admin")
        await message.answer(
            "Привет, админ! Сюда будут приходить сообщения."
        )
    else:
        await save_user(uid, username, first_name, role="user")
        await message.answer(
            "Привет! Напишите ваш вопрос сюда, и админ ответит."
        )


@dp.message()
async def handle_messages(message: Message) -> None:
    if not message.text:
        return

    uid = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name

    if uid == ADMIN_ID:
        if message.reply_to_message:
            admin_reply_id = message.reply_to_message.message_id
            sql = """
            SELECT tg_user_id FROM tg_messages
            WHERE tg_message_id = %s AND direction = 'inbound'
            LIMIT 1
            """
            async with db_pool.acquire() as conn, conn.cursor() as cur:
                await cur.execute(sql, (admin_reply_id,))
                res = await cur.fetchone()

            if res:
                target_user_id = res[0] if isinstance(res, tuple) else res
                try:
                    await bot.send_message(
                        chat_id=target_user_id,
                        text=f"Ответ поддержки:\n\n{message.text}",
                    )
                    await log_message(target_user_id, message.text, "outbound")
                    await message.answer("Ответ отправлен пользователю.")
                    logger.info(f"Админ ответил пользователю {target_user_id}")
                except Exception as e:
                    await message.answer(f"Не удалось доставить: {e}")
                    logger.error(
                        f"Ошибка ответа пользователю {target_user_id}: {e}"
                    )
            else:
                await message.answer("Не нашли пользователя в базе данных.")
                logger.warning(
                    f"Не найден юзер в БД для ответа на {admin_reply_id}"
                )
        else:
            await message.answer("Используйте Reply на сообщение пользователя.")

    else:
        await save_user(uid, username, first_name, role="user")
        await log_message(uid, message.text, "inbound")
        logger.info(f"Получено сообщение от {uid}: {message.text[:30]}...")

        try:
            fmt_text = (
                f"✉️ **Новое обращение**\n"
                f"От: {first_name} (@{username or 'нет'})\n"
                f"ID: {uid}\n\n{message.text}"
            )
            sent_msg = await bot.send_message(chat_id=ADMIN_ID, text=fmt_text)
            await log_message(
                uid,
                message.text,
                "inbound",
                tg_message_id=sent_msg.message_id,
            )
            await message.answer("Ваше сообщение отправлено.")
        except Exception as e:
            logger.error(
                f"Ошибка при пересылке сообщения админу от {uid}: {e}"
            )
            await message.answer("Ошибка. Попробуйте позже.")


async def main() -> None:
    try:
        await init_db()
        logger.info("Бот запущен и готов к работе!")
        await dp.start_polling(bot)
    except Exception as e:
        logger.critical(
            f"Критическая ошибка: {e}", exc_info=True
        )
    finally:
        if db_pool:
            db_pool.close()
            await db_pool.wait_closed()
            logger.info("Пул подключений к БД закрыт.")


if __name__ == "__main__":
    asyncio.run(main())
