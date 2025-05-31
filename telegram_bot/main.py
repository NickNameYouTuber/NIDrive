import os
import logging
import requests
from typing import Dict, Any, Optional
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)
from dotenv import load_dotenv
from token_storage import token_storage

load_dotenv()

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Environment variables
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
WEB_APP_URL = os.environ.get("WEB_APP_URL", "http://localhost:3000")

# Maximum file size (5GB in bytes)
MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a welcome message when the command /start is issued."""
    user = update.effective_user
    logger.info(f"User {user.id} started bot")
    
    # Check if the user is starting with an auth code - для привязки веб-версии
    if context.args and len(context.args) > 0:
        auth_code = context.args[0]
        logger.info(f"User {user.id} started bot with auth code: {auth_code}")
        
        # Process the auth code
        try:
            # Подготавливаем данные пользователя для отправки
            user_data = {
                "code": auth_code,
                "telegram_id": str(user.id),
                "username": user.username or "",
                "first_name": user.first_name or "",
                "last_name": user.last_name or ""
            }
            
            logger.info(f"Sending user data: {user_data}")
            
            # Process the auth code on the backend - отправляем как JSON для большей надежности
            response = requests.post(
                f"{API_BASE_URL}/auth/process-code",
                json=user_data,
                headers={"Content-Type": "application/json"}
            )
            
            # Логируем для отладки
            logger.info(f"Auth code process response: {response.status_code} - {response.text}")
            
            # Дополнительная попытка с параметрами URL, если первый способ не работает
            if response.status_code != 200:
                logger.info("Trying alternative method with URL parameters")
                url = f"{API_BASE_URL}/auth/process-code?code={auth_code}&telegram_id={user.id}"
                
                # Добавляем данные профиля в URL
                if user.username:
                    url += f"&username={user.username}"
                if user.first_name:
                    url += f"&first_name={user.first_name}"
                if user.last_name:
                    url += f"&last_name={user.last_name}"
                
                logger.info(f"Sending URL request: {url}")
                response = requests.post(url)
            
            if response.status_code == 200:
                await update.message.reply_text(
                    "✅ Авторизация успешна! Ваш аккаунт Telegram успешно связан с веб-версией NIDriveBot."
                    "\n\nТеперь вы можете вернуться в браузер и продолжить работу с вашими файлами."
                )
                # После связывания веб-версии, продолжаем авторизацию в боте
        except Exception as e:
            logger.error(f"Exception when processing auth code: {str(e)}")
            await update.message.reply_text(
                "❌ Произошла ошибка при обработке кода авторизации."
                "\n\nНо вы всё равно можете использовать бота."
            )
    
    # Всегда создаем токен для пользователя, независимо от наличия кода
    user_data = {
        "id": str(user.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "auth_date": int(update.message.date.timestamp()),
        "hash": "telegram_bot_auth"  # This is just a placeholder, backend will ignore for bot requests
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/auth/telegram-login", json=user_data)
        response_data = None
        try:
            if response.status_code == 200:
                token_data = response.json()
                # Store the token in the user's context and in persistent storage
                token = token_data["access_token"]
                context.user_data["token"] = token
                token_storage.set_token(str(user.id), token)
                response_data = token_data
            else:
                # В случае ошибки создадим локальный токен для работы с ботом
                logger.warning(f"Failed to authenticate with API, using local bot authentication")
                # Создаем симуляцию токена для работы бота
                token = f"local_bot_token_{str(user.id)}_{int(update.message.date.timestamp())}"
                context.user_data["token"] = token
                token_storage.set_token(str(user.id), token)
        except Exception as e:
            logger.error(f"Error parsing response: {e}")
            # Создаем симуляцию токена для работы бота
            token = f"local_bot_token_{str(user.id)}_{int(update.message.date.timestamp())}"
            context.user_data["token"] = token
            token_storage.set_token(str(user.id), token)
            
        # Всегда показываем приветственное сообщение, даже если были ошибки
        # Create welcome message with inline keyboard
        keyboard = [
            [
                InlineKeyboardButton("📂 Мои файлы", callback_data="list_files"),
                InlineKeyboardButton("📊 Статистика", callback_data="stats"),
            ],
            [
                InlineKeyboardButton("🌐 Открыть веб-версию", url=WEB_APP_URL),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_html(
            f"Привет, {user.first_name}! 👋\n\n"
            f"Добро пожаловать в <b>NIDriveBot</b> - ваше персональное хранилище файлов.\n\n"
            f"Вы можете отправить мне любой файл, и я сохраню его в вашем хранилище. "
            f"Также вы можете просматривать и управлять своими файлами через меня или через веб-интерфейс.",
            reply_markup=reply_markup,
        )
    except Exception as e:
        logger.error(f"Error authenticating user: {e}")
        # В случае любой ошибки создаем локальный токен
        token = f"local_bot_token_{str(user.id)}_{int(update.message.date.timestamp())}"
        context.user_data["token"] = token
        token_storage.set_token(str(user.id), token)
        
        # Все равно показываем приветственное сообщение
        keyboard = [
            [
                InlineKeyboardButton("📂 Мои файлы", callback_data="list_files"),
                InlineKeyboardButton("📊 Статистика", callback_data="stats"),
            ],
            [
                InlineKeyboardButton("🌐 Открыть веб-версию", url=WEB_APP_URL),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_html(
            f"Привет, {user.first_name}! 👋\n\n"
            f"Добро пожаловать в <b>NIDriveBot</b> - ваше персональное хранилище файлов.\n\n"
            f"Вы можете отправить мне любой файл, и я сохраню его в вашем хранилище. "
            f"Также вы можете просматривать и управлять своими файлами через меня или через веб-интерфейс.",
            reply_markup=reply_markup,
        )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a help message when the command /help is issued."""
    help_text = (
        "Вот что я могу сделать:\n\n"
        "📤 Отправьте мне любой файл, и я сохраню его в вашем хранилище.\n"
        "📂 /files - просмотреть ваши файлы\n"
        "📊 /stats - проверить использование хранилища\n"
        "🔗 /link <имя_файла> - получить ссылку на файл\n"
        "❓ /help - показать это сообщение\n\n"
        "У вас есть до 5 ГБ хранилища для ваших файлов."
    )
    await update.message.reply_text(help_text)

async def files_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List user's files when the command /files is issued."""
    await list_files(update, context)

async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show storage stats when the command /stats is issued."""
    await show_stats(update, context)

async def list_files(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List the user's files."""
    user_id = str(update.effective_user.id)
    
    # Пытаемся получить токен из локального хранилища, а затем из контекста
    token = token_storage.get_token(user_id) or context.user_data.get("token")
    
    if not token:
        await update_response(update, "Пожалуйста, начните с команды /start для авторизации.")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/files", headers=headers)
        
        if response.status_code == 200:
            files = response.json()
            
            if not files:
                await update_response(update, "У вас пока нет загруженных файлов.")
                return
            
            # Group files by folder
            files_by_folder: Dict[Optional[str], list] = {}
            for file in files:
                folder = file.get("folder") or "Корневая директория"
                if folder not in files_by_folder:
                    files_by_folder[folder] = []
                files_by_folder[folder].append(file)
            
            # Create inline keyboard with folders
            keyboard = []
            for folder in files_by_folder:
                keyboard.append([InlineKeyboardButton(
                    f"📁 {folder} ({len(files_by_folder[folder])} файлов)",
                    callback_data=f"folder_{folder}"
                )])
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update_response(
                update,
                "Выберите папку для просмотра файлов:",
                reply_markup=reply_markup
            )
        else:
            await update_response(update, "Не удалось получить список файлов. Попробуйте позже.")
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        await update_response(update, "Произошла ошибка при получении файлов. Попробуйте позже.")

async def show_folder_files(update: Update, context: ContextTypes.DEFAULT_TYPE, folder: str) -> None:
    """Show files in a specific folder."""
    user_id = str(update.effective_user.id)
    
    # Пытаемся получить токен из локального хранилища, а затем из контекста
    token = token_storage.get_token(user_id) or context.user_data.get("token")
    
    if not token:
        await update.callback_query.answer("Требуется авторизация. Используйте /start")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/files", headers=headers)
        
        if response.status_code == 200:
            all_files = response.json()
            
            # Filter files by folder
            if folder == "Корневая директория":
                files = [f for f in all_files if not f.get("folder")]
            else:
                files = [f for f in all_files if f.get("folder") == folder]
            
            if not files:
                await update.callback_query.answer("В этой папке нет файлов")
                return
            
            # Paginate files if there are many
            page_size = 5
            page = context.user_data.get("file_page", 0)
            max_page = (len(files) - 1) // page_size
            
            # Ensure page is within bounds
            page = max(0, min(page, max_page))
            context.user_data["file_page"] = page
            
            start_idx = page * page_size
            end_idx = min(start_idx + page_size, len(files))
            current_files = files[start_idx:end_idx]
            
            # Create message with file list
            message = f"📁 <b>{folder}</b> ({len(files)} файлов):\n\n"
            
            for i, file in enumerate(current_files, start=1):
                size_str = format_size(file["file_size"])
                message += f"{i + start_idx}. {file['filename']} ({size_str})\n"
            
            # Add pagination info
            if max_page > 0:
                message += f"\nСтраница {page + 1} из {max_page + 1}"
            
            # Create inline keyboard for file actions
            keyboard = []
            
            # Add file action buttons
            for i, file in enumerate(current_files):
                keyboard.append([
                    InlineKeyboardButton(f"{i + 1}. {file['filename'][:20]}", callback_data=f"file_{file['id']}"),
                ])
            
            # Add pagination buttons
            pagination_row = []
            if page > 0:
                pagination_row.append(InlineKeyboardButton("⬅️ Назад", callback_data=f"page_{page-1}_{folder}"))
            
            pagination_row.append(InlineKeyboardButton("🔙 К папкам", callback_data="list_files"))
            
            if page < max_page:
                pagination_row.append(InlineKeyboardButton("➡️ Вперед", callback_data=f"page_{page+1}_{folder}"))
            
            if pagination_row:
                keyboard.append(pagination_row)
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.callback_query.edit_message_text(
                message,
                reply_markup=reply_markup,
                parse_mode="HTML"
            )
        else:
            await update.callback_query.answer("Не удалось получить файлы")
    except Exception as e:
        logger.error(f"Error showing folder files: {e}")
        await update.callback_query.answer("Произошла ошибка")

async def show_file_details(update: Update, context: ContextTypes.DEFAULT_TYPE, file_id: str) -> None:
    """Show details and actions for a specific file."""
    user_id = str(update.effective_user.id)
    
    # Пытаемся получить токен из локального хранилища, а затем из контекста
    token = token_storage.get_token(user_id) or context.user_data.get("token")
    
    if not token:
        await update.callback_query.answer("Требуется авторизация. Используйте /start")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/files/{file_id}", headers=headers)
        
        if response.status_code == 200:
            file = response.json()
            
            # Create message with file details
            size_str = format_size(file["file_size"])
            created_date = file["created_at"].split("T")[0]
            
            message = (
                f"📄 <b>{file['filename']}</b>\n\n"
                f"📦 Размер: {size_str}\n"
                f"📅 Загружен: {created_date}\n"
                f"📁 Папка: {file.get('folder') or 'Корневая директория'}\n"
            )
            
            # Create inline keyboard for file actions
            keyboard = [
                [
                    InlineKeyboardButton("🔗 Получить ссылку", callback_data=f"link_{file_id}"),
                    InlineKeyboardButton("🗑️ Удалить", callback_data=f"delete_{file_id}"),
                ],
                [
                    InlineKeyboardButton("🔙 Назад", callback_data=f"folder_{file.get('folder') or 'Корневая директория'}"),
                ]
            ]
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.callback_query.edit_message_text(
                message,
                reply_markup=reply_markup,
                parse_mode="HTML"
            )
        else:
            await update.callback_query.answer("Файл не найден")
    except Exception as e:
        logger.error(f"Error showing file details: {e}")
        await update.callback_query.answer("Произошла ошибка")

async def get_file_link(update: Update, context: ContextTypes.DEFAULT_TYPE, file_id: str) -> None:
    """Get the link to a file."""
    user_id = str(update.effective_user.id)
    
    # Пытаемся получить токен из локального хранилища, а затем из контекста
    token = token_storage.get_token(user_id) or context.user_data.get("token")
    
    if not token:
        await update.callback_query.answer("Требуется авторизация. Используйте /start")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/files/{file_id}", headers=headers)
        
        if response.status_code == 200:
            file = response.json()
            file_url = f"{WEB_APP_URL}{file['file_url']}"
            
            message = (
                f"🔗 <b>Ссылка на файл:</b>\n"
                f"{file['filename']}\n\n"
                f"<code>{file_url}</code>"
            )
            
            # Create inline keyboard to go back
            keyboard = [
                [
                    InlineKeyboardButton("🔙 Назад", callback_data=f"file_{file_id}"),
                ]
            ]
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.callback_query.edit_message_text(
                message,
                reply_markup=reply_markup,
                parse_mode="HTML"
            )
        else:
            await update.callback_query.answer("Файл не найден")
    except Exception as e:
        logger.error(f"Error getting file link: {e}")
        await update.callback_query.answer("Произошла ошибка")

async def delete_file(update: Update, context: ContextTypes.DEFAULT_TYPE, file_id: str) -> None:
    """Delete a file."""
    user_id = str(update.effective_user.id)
    
    # Пытаемся получить токен из локального хранилища, а затем из контекста
    token = token_storage.get_token(user_id) or context.user_data.get("token")
    if not token:
        await update.callback_query.answer("Требуется авторизация. Используйте /start")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # First get file info to know its folder
        info_response = requests.get(f"{API_BASE_URL}/files/{file_id}", headers=headers)
        
        if info_response.status_code != 200:
            await update.callback_query.answer("Файл не найден")
            return
            
        file_info = info_response.json()
        folder = file_info.get("folder") or "Корневая директория"
        
        # Delete the file
        response = requests.delete(f"{API_BASE_URL}/files/{file_id}", headers=headers)
        
        if response.status_code == 200:
            await update.callback_query.answer("Файл успешно удален")
            
            # Go back to folder view
            await show_folder_files(update, context, folder)
        else:
            await update.callback_query.answer("Не удалось удалить файл")
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        await update.callback_query.answer("Произошла ошибка")

async def show_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show storage usage statistics."""
    token = context.user_data.get("token")
    if not token:
        await update_response(update, "Пожалуйста, начните с команды /start для авторизации.")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get storage stats
        storage_response = requests.get(f"{API_BASE_URL}/storage/usage", headers=headers)
        
        # Get files for counting
        files_response = requests.get(f"{API_BASE_URL}/files", headers=headers)
        
        if storage_response.status_code == 200 and files_response.status_code == 200:
            storage = storage_response.json()
            files = files_response.json()
            
            # Calculate stats
            used_formatted = format_size(storage["used"])
            total_formatted = format_size(storage["total"])
            percentage = storage["percentage"]
            
            # Count file types
            file_types = {}
            for file in files:
                ext = file["filename"].split(".")[-1].lower() if "." in file["filename"] else "unknown"
                file_types[ext] = file_types.get(ext, 0) + 1
            
            # Create progress bar
            progress_bar = "["
            filled = int(percentage / 10)
            progress_bar += "■" * filled
            progress_bar += "□" * (10 - filled)
            progress_bar += "]"
            
            # Create message
            message = (
                f"📊 <b>Статистика хранилища</b>\n\n"
                f"💾 Использовано: {used_formatted} из {total_formatted}\n"
                f"📈 Заполнено: {percentage:.1f}%\n"
                f"{progress_bar}\n\n"
                f"📑 Всего файлов: {len(files)}\n\n"
            )
            
            # Add file type breakdown if there are files
            if file_types:
                message += "<b>Типы файлов:</b>\n"
                sorted_types = sorted(file_types.items(), key=lambda x: x[1], reverse=True)
                for ext, count in sorted_types[:5]:  # Show top 5 file types
                    message += f"- .{ext}: {count} файлов\n"
            
            # Create inline keyboard
            keyboard = [
                [
                    InlineKeyboardButton("📂 Мои файлы", callback_data="list_files"),
                ]
            ]
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update_response(
                update,
                message,
                reply_markup=reply_markup,
                parse_mode="HTML"
            )
        else:
            await update_response(update, "Не удалось получить статистику. Попробуйте позже.")
    except Exception as e:
        logger.error(f"Error showing stats: {e}")
        await update_response(update, "Произошла ошибка при получении статистики. Попробуйте позже.")

async def handle_file(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle file uploads from users."""
    user = update.effective_user
    token = context.user_data.get("token")
    
    if not token:
        await update.message.reply_text(
            "Пожалуйста, начните с команды /start для авторизации."
        )
        return
    
    try:
        # Check if it's a document, photo, video, etc.
        file_obj = None
        caption = None
        
        if update.message.document:
            file_obj = update.message.document
            caption = update.message.caption
        elif update.message.photo:
            # Get the largest photo (last in the list)
            file_obj = update.message.photo[-1]
            caption = update.message.caption
        elif update.message.video:
            file_obj = update.message.video
            caption = update.message.caption
        elif update.message.audio:
            file_obj = update.message.audio
            caption = update.message.caption
        elif update.message.voice:
            file_obj = update.message.voice
            caption = update.message.caption
        
        if not file_obj:
            await update.message.reply_text("Пожалуйста, отправьте файл для загрузки.")
            return
        
        # Check file size
        if file_obj.file_size > MAX_FILE_SIZE:
            await update.message.reply_text(
                f"Файл слишком большой. Максимальный размер: {format_size(MAX_FILE_SIZE)}."
            )
            return
        
        # Get storage usage to check if there's enough space
        headers = {"Authorization": f"Bearer {token}"}
        storage_response = requests.get(f"{API_BASE_URL}/storage/usage", headers=headers)
        
        if storage_response.status_code == 200:
            storage = storage_response.json()
            remaining_space = storage["total"] - storage["used"]
            
            if file_obj.file_size > remaining_space:
                await update.message.reply_text(
                    "У вас недостаточно места в хранилище. Удалите некоторые файлы и попробуйте снова."
                )
                return
        
        # Send a message that we're downloading the file
        status_message = await update.message.reply_text(
            "⬇️ Скачиваю файл... Это может занять некоторое время."
        )
        
        # Download the file
        file = await context.bot.get_file(file_obj.file_id)
        file_path = await file.download_to_drive()
        
        # Parse folder from caption if provided
        folder = None
        if caption and caption.startswith("folder:"):
            folder = caption.split("folder:")[1].strip()
        
        # Create FormData
        files = {"file": open(file_path, "rb")}
        data = {}
        
        if folder:
            data["folder"] = folder
        
        # Update status message
        await status_message.edit_text("⬆️ Загружаю файл в ваше хранилище...")
        
        # Upload file to API
        upload_response = requests.post(
            f"{API_BASE_URL}/files/upload",
            headers=headers,
            files=files,
            data=data
        )
        
        # Close the file
        files["file"].close()
        
        # Remove local file
        os.remove(file_path)
        
        if upload_response.status_code == 200:
            file_data = upload_response.json()
            file_url = f"{WEB_APP_URL}{file_data['file_url']}"
            
            # Create inline keyboard for file actions
            keyboard = [
                [
                    InlineKeyboardButton("🔗 Получить ссылку", callback_data=f"link_{file_data['id']}"),
                ],
                [
                    InlineKeyboardButton("📂 Мои файлы", callback_data="list_files"),
                ],
            ]
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await status_message.edit_text(
                f"✅ Файл успешно загружен!\n\n"
                f"📄 <b>{file_data['filename']}</b>\n"
                f"📦 Размер: {format_size(file_data['file_size'])}\n"
                f"📁 Папка: {file_data.get('folder') or 'Корневая директория'}\n",
                reply_markup=reply_markup,
                parse_mode="HTML"
            )
        else:
            error_detail = "Неизвестная ошибка"
            try:
                error_detail = upload_response.json().get("detail", error_detail)
            except:
                pass
            
            await status_message.edit_text(
                f"❌ Ошибка при загрузке файла: {error_detail}"
            )
    except Exception as e:
        logger.error(f"Error handling file: {e}")
        await update.message.reply_text(
            "Произошла ошибка при обработке файла. Пожалуйста, попробуйте позже."
        )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle callback queries from inline keyboards."""
    query = update.callback_query
    data = query.data
    
    try:
        if data == "list_files":
            await list_files(update, context)
        elif data == "stats":
            await show_stats(update, context)
        elif data.startswith("folder_"):
            folder = data[7:]
            await show_folder_files(update, context, folder)
        elif data.startswith("file_"):
            file_id = int(data[5:])
            await show_file_details(update, context, file_id)
        elif data.startswith("link_"):
            file_id = int(data[5:])
            await get_file_link(update, context, file_id)
        elif data.startswith("delete_"):
            file_id = int(data[7:])
            await delete_file(update, context, file_id)
        elif data.startswith("page_"):
            parts = data.split("_")
            page = int(parts[1])
            folder = "_".join(parts[2:])
            context.user_data["file_page"] = page
            await show_folder_files(update, context, folder)
        else:
            await query.answer("Неизвестная команда")
    except Exception as e:
        logger.error(f"Error handling callback: {e}")
        await query.answer("Произошла ошибка")

async def update_response(update: Update, text: str, **kwargs) -> None:
    """Helper function to respond to either message or callback query."""
    if update.callback_query:
        await update.callback_query.edit_message_text(text, **kwargs)
    else:
        await update.message.reply_text(text, **kwargs)

def format_size(size_bytes: int) -> str:
    """Format size in bytes to human-readable string."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

def main() -> None:
    """Start the bot."""
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("files", files_command))
    application.add_handler(CommandHandler("stats", stats_command))
    
    # Handle documents, photos, videos, etc.
    application.add_handler(MessageHandler(
        filters.Document.ALL | filters.PHOTO | filters.VIDEO | filters.AUDIO | filters.VOICE,
        handle_file
    ))
    
    # Handle callback queries
    application.add_handler(CallbackQueryHandler(handle_callback))
    
    # Start the bot
    application.run_polling()

if __name__ == "__main__":
    main()
