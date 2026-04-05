const { google } = require('googleapis');

/**
 * Switch from SMTP/Resend to Google Gmail API (HTTP)
 * - Free (No cost)
 * - No Domain Required (Sends from your @gmail.com)
 * - Render Compatible (Uses Port 443, never blocked)
 */

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URI used in Playground
);

oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const sendEmail = async (options) => {
    try {
        console.log(`Attempting to send email to ${options.email} via Gmail API...`);

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        // Gmail API requires the email to be base64url encoded
        const subject = options.subject;
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `From: EventFlow <${process.env.EMAIL_USER}>`, // The email you used to get tokens
            `To: ${options.email}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            `
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
            `
        ];
        const message = messageParts.join('\n');

        // The body needs to be base64url encoded
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        console.log("Email sent successfully via Gmail API. ID:", res.data.id);
        return res.data;

    } catch (err) {
        console.error("Gmail API Sending Failed:", err.message);
        // If there's an auth error, it might be an expired token or wrong credentials
        if (err.message.includes('invalid_grant')) {
            console.error("CRITICAL: Your Google Refresh Token is invalid or has been revoked.");
        }
        throw err;
    }
};

module.exports = sendEmail;
