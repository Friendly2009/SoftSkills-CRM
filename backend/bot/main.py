import asyncio
import os

from aiogram import Bot, Dispatcher, F
from aiogram.types import Message
from dotenv import load_dotenv
import aiomysql

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
try:
    ADMIN_ID = int(os.getenv("ADMIN_ID"))
except (TypeError, ValueError):
    raise ValueError(
        "Ошибка: Проверьте ADMIN_ID в файле .env (должно быть число)"
    )

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
db_pool: aiomysql.Pool | None = None


async def init_db() -> None:
    global db_pool
    db_pool = await aiomysql.create_pool(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        db=os.getenv("DB_NAME"),
        autocommit=True
    )


async def save_user(
    tg_id: int,
    username: str | None,
    first_name: str | None,
    role: str = 'user'
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
            sql, (tg_id, username or '', first_name or '', role)
        )


async def log_message(
    tg_user_id: int,
    message_text: str,
    direction: str,
    tg_message_id: int | None = None
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

    if uid == ADMIN_ID:
        await save_user(uid, username, first_name, role='admin')
        await message.answer(
            "Привет, админ! Сюда будут приходить сообщения."
        )
    else:
        await save_user(uid, username, first_name, role='user')
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
                        text=f"Ответ поддержки:\n\n{message.text}"
                    )
                    await log_message(target_user_id, message.text, 'outbound')
                    await message.answer("Ответ отправлен пользователю.")
                except Exception as e:
                    await message.answer(f"Не удалось доставить: {e}")
            else:
                await message.answer("Не нашли пользователя в базе данных.")
        else:
            await message.answer("Используйте Reply на сообщение пользователя.")

    else:
        await save_user(uid, username, first_name, role='user')
        await log_message(uid, message.text, 'inbound')

        try:
            fmt_text = (
                f"✉️ **Новое обращение**\n"
                f"От: {first_name} (@{username or 'нет'})\n"
                f"ID: {uid}\n\n{message.text}"
            )
            sent_msg = await bot.send_message(
                chat_id=ADMIN_ID,
                text=fmt_text
            )
            await log_message(
                uid, message.text, 'inbound',
                tg_message_id=sent_msg.message_id
            )
            await message.answer("Ваше сообщение отправлено.")
        except Exception as e:
            print(f"Ошибка при отправке админу: {e}")
            await message.answer("Ошибка. Попробуйте позже.")


async def main() -> None:
    await init_db()
    print("Бот запущен. Ошибок линтера больше нет!")
    try:
        await dp.start_polling(bot)
    finally:
        db_pool.close()
        await db_pool.wait_closed()


if __name__ == "__main__":
    asyncio.run(main())
