from telegram import ReplyKeyboardMarkup
from telegram.ext import (Updater, CommandHandler, ConversationHandler,MessageHandler,Filters)

buttons=ReplyKeyboardMarkup([['1⃣ Dushanba','2⃣ Seshanba'],['3⃣ Chorshanba','4⃣ Payshanba'],['5⃣ Juma','6⃣ Shanba'],['📝 Izoh qoldirish'],['🆘 Bot haqida','👨‍✈️ Admin bilan aloqa']], resize_keyboard = True)

def start(update, context):
    update.message.reply_html(
        '<i>Salom</i>  {}'.format(update.message.from_user.first_name)+' botimizga xush kelibsiz..!', reply_markup=buttons)
    return 1
def stats(update,context):
    update.message.reply_text(
        'statistika belgilandi',reply_markup=buttons)

def world(update,context):
    update.message.reply_text(
        'dunyo belgilandi',reply_markup=buttons)

updater = Updater('781836471:AAF8PtgB90GdbHcuAIM9FoJK4tUDvtawlk8', use_context=True)
conv_handler=ConversationHandler(
    entry_points=[CommandHandler('start',start)],
    states={
        1:[
            MessageHandler(Filters.regex('^(statistika)$'),stats),
            MessageHandler(Filters.regex('^(dunyo)$'),world),
        ]
    },
    fallbacks=[MessageHandler(Filters.text,start)]
)

updater.dispatcher.add_handler(conv_handler)

updater.start_polling()
updater.idle()