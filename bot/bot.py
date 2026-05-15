#!/usr/bin/env python3
"""
Древнерусская Летняя Сказка - Telegram Bot
Match-3 game bot with Web App support
"""

import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)
from config import TOKEN, WEBAPP_URL

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send welcome message with Web App button"""
    keyboard = [
        [
            InlineKeyboardButton(
                "🍓 Играть!",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "🏛 Древнерусская Летняя Сказка\n\n"
        "Собирай ягоды, грибы и цветы в три ряда!\n"
        "Собирай комбинации и проходи уровни!\n\n"
        "Нажми кнопку ниже чтобы начать игру 🎮",
        reply_markup=reply_markup
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send help information"""
    await update.message.reply_text(
        "🍓 Древнерусская Летняя Сказка\n\n"
        "Правила:\n"
        "• Меняй соседние иконки местами\n"
        "• Собирай 3 и более в ряд\n"
        "• 4 в ряд = ракета 🚀\n"
        "• 5 в ряд = бомба 💣\n"
        "• Проходи уровни и набирай очки!\n\n"
        "Используй /start для начала игры"
    )


async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show player statistics"""
    user_id = str(update.effective_user.id)
    # Stats would be loaded from storage in real implementation
    await update.message.reply_text(
        "📊 Статистика игрока:\n\n"
        "Уровень: 1\n"
        "Очки: 0\n"
        "Игр сыграно: 0"
    )


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.error(f"Update {update} caused error {context.error}")


def main():
    """Start the bot"""
    application = Application.builder().token(TOKEN).build()

    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("stats", stats))
    application.add_error_handler(error_handler)

    # Start polling
    logger.info("Бот запущен!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()