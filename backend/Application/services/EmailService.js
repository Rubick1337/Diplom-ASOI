const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.yandex.ru',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    async sendVerificationCode(to, code) {
        await this.transporter.sendMail({
            from: `"GooseCode" <${process.env.SMTP_USER}>`,
            to,
            subject: 'Код подтверждения регистрации',
            text: `GooseCode — Подтверждение регистрации\n\nВаш код подтверждения: ${code}\n\nКод действителен 5 минут. Если вы не регистрировались — просто проигнорируйте это письмо.`,
        });
    }
}

module.exports = new EmailService();
