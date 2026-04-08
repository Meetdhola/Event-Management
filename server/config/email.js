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
                <div style="background-color: #0c0c0e; color: #f5f5f5; font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 24px; text-align: center;">
                    <div style="margin-bottom: 30px;">
                        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 5px; color: #d4af37; font-weight: 900; border: 1px solid rgba(212, 175, 55, 0.3); padding: 5px 15px; border-radius: 100px;">Secure Terminal</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">Elite <span style="color: #d4af37;">Access.</span></h1>
                    <p style="font-size: 14px; opacity: 0.8; line-height: 1.6; margin-bottom: 40px; text-transform: lowercase; letter-spacing: 1px;">Hello, the following handshake sequence has been initiated for your account. Please use the verification code below to authorize access.</p>
                    
                    <div style="margin: 40px 0; background: rgba(255, 255, 255, 0.03); padding: 30px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.05);">
                        <span style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #d4af37; text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);">
                            ${options.otp}
                        </span>
                    </div>
                    
                    <p style="font-size: 11px; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 2px; margin-top: 40px;">Expiring in 10 minutes • Mission Critical</p>
                    
                    <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                        <p style="font-size: 9px; color: rgba(255, 255, 255, 0.3); text-transform: uppercase; letter-spacing: 3px;">© ELITE GLOBAL INFRASTRUCTURE</p>
                    </div>
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
