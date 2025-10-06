const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Токен вашего бота (замените на реальный)
const BOT_TOKEN = '7832350904:AAGSpgPYO9VHLNY3zaRSHXATforUuNc1smk';

// Middleware
app.use(cors());
app.use(express.json());

// Функция для проверки Telegram Web App данных
function verifyTelegramData(initData) {
    try {
        // Парсим initData
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        
        if (!hash) {
            return { success: false, error: 'Hash not found' };
        }

        // Удаляем хэш из параметров
        params.delete('hash');

        // Сортируем параметры по алфавиту
        const dataCheckArray = [];
        for (const [key, value] of params.entries()) {
            dataCheckArray.push(`${key}=${value}`);
        }
        dataCheckArray.sort();

        // Формируем строку для проверки
        const dataCheckString = dataCheckArray.join('\n');

        // Создаем секретный ключ
        const secretKey = crypto.createHmac('sha256', 'WebAppData')
            .update(BOT_TOKEN)
            .digest();

        // Вычисляем хэш
        const calculatedHash = crypto.createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        // Сравниваем хэши
        if (calculatedHash === hash) {
            return { success: true };
        } else {
            return { 
                success: false, 
                error: 'Invalid hash',
                details: {
                    received: hash,
                    calculated: calculatedHash
                }
            };
        }

    } catch (error) {
        return { 
            success: false, 
            error: `Verification error: ${error.message}` 
        };
    }
}

// Эндпоинт для проверки данных
app.post('/verify', (req, res) => {
    try {
        const { initData } = req.body;

        if (!initData) {
            return res.status(400).json({
                success: false,
                error: 'initData is required'
            });
        }

        console.log('🔐 Received initData for verification');

        const verificationResult = verifyTelegramData(initData);

        if (verificationResult.success) {
            console.log('✅ Data verification successful');
            res.json({ success: true });
        } else {
            console.log('❌ Data verification failed:', verificationResult.error);
            res.status(401).json({
                success: false,
                error: verificationResult.error,
                details: verificationResult.details
            });
        }

    } catch (error) {
        console.error('💥 Server error:', error);
        res.status(500).json({
            success: false,
            error: `Server error: ${error.message}`
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Telegram WebApp Validator'
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Verify endpoint: http://localhost:${PORT}/verify`);
});

module.exports = app;
