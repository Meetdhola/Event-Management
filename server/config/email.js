const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    let transporter;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log(`Using SMTP configuration: ${process.env.EMAIL_SERVICE || 'gmail'} for ${process.env.EMAIL_USER}`);
        // Use provided credentials with more reliable port 587
        transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Port 587 uses STARTTLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false // Helps in cloud environments like Render
            },
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
            family: 4 // Force IPv4 to avoid IPv6 routing issues on Render
        });
    } else {
        // Fallback to dynamic Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log("Using temporary Ethereal account:", testAccount.user);
    }

    const message = {
        from: `"Intelligent Event Hub" <${process.env.EMAIL_FROM || 'noreply@eventhub.ai'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #3b82f6; text-align: center;">Intelligent Event Hub</h2>
                <p>Hello,</p>
                <p>${options.message}</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3b82f6; background: #f0f7ff; padding: 10px 20px; border-radius: 5px;">
                        ${options.otp}
                    </span>
                </div>
                <p style="font-size: 12px; color: #777;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
        `,
    };

    const info = await transporter.sendMail(message);

    console.log("Message sent: %s", info.messageId);
    if (!process.env.EMAIL_USER) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
};

module.exports = sendEmail;
