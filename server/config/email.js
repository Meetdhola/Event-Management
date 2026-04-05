const { Resend } = require('resend');

/**
 * Switch from SMTP to Resend API
 * This bypasses Render's SMTP port blocking (465/587)
 */
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
    // If no API key, log error and skip (security fallback)
    if (!process.env.RESEND_API_KEY) {
        console.error("CRITICAL: RESEND_API_KEY is missing from environment variables.");
        throw new Error("Email service not configured.");
    }

    try {
        console.log(`Attempting to send email to ${options.email} via Resend API...`);

        const { data, error } = await resend.emails.send({
            from: 'EventFlow <onboarding@resend.dev>', // Resend requires this for unverified domains
            to: options.email,
            subject: options.subject,
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
        });

        if (error) {
            console.error("Resend API Error:", error);
            throw new Error(error.message);
        }

        console.log("Email sent successfully via Resend. ID:", data.id);
        return data;

    } catch (err) {
        console.error("Email Sending Failed:", err.message);
        throw err;
    }
};

module.exports = sendEmail;
