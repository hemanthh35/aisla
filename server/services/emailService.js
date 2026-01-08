// Email Service - SendGrid integration for notifications
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send email notification to multiple recipients
 * @param {Array} recipients - Array of email addresses
 * @param {String} subject - Email subject
 * @param {String} htmlContent - HTML content of the email
 * @param {String} textContent - Plain text version
 */
const sendBulkEmail = async (recipients, subject, htmlContent, textContent) => {
    try {
        if (!recipients || recipients.length === 0) {
            console.log('⚠️ No recipients provided for email');
            return { success: false, message: 'No recipients' };
        }

        // SendGrid message configuration
        const msg = {
            from: {
                email: process.env.SENDGRID_FROM_EMAIL || 'noreply@aisla.com',
                name: 'AISLA - AI Self Learning Lab Assistant'
            },
            subject,
            text: textContent,
            html: htmlContent,
            personalizations: recipients.map(email => ({
                to: [{ email }]
            })),
            mailSettings: {
                sandboxMode: {
                    enable: process.env.NODE_ENV === 'test' // Enable sandbox in test
                }
            }
        };

        // Send email
        const response = await sgMail.send(msg);
        console.log(`✅ Email sent successfully to ${recipients.length} recipients`);
        
        return {
            success: true,
            message: `Email sent to ${recipients.length} students`,
            recipients: recipients.length
        };
    } catch (error) {
        console.error('❌ SendGrid Error:', error);
        
        if (error.response) {
            console.error('SendGrid Response:', error.response.body);
        }
        
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Send new experiment notification to students
 * @param {Array} studentEmails - Array of student email addresses
 * @param {Object} experiment - Experiment details
 * @param {Object} creator - Faculty/Admin who created the experiment
 */
const sendNewExperimentNotification = async (studentEmails, experiment, creator) => {
    try {
        const subject = `🔬 New Experiment Available: ${experiment.title}`;
        
        // HTML Email Template
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px 25px;
        }
        .experiment-card {
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
            border-left: 4px solid #6366f1;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .experiment-title {
            font-size: 22px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 10px;
        }
        .experiment-meta {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        .meta-item {
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 13px;
            color: #6366f1;
            font-weight: 500;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 20px;
            text-align: center;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .creator-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        .footer a {
            color: #6366f1;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔬 New Experiment Available!</h1>
            <p>A new learning opportunity is ready for you</p>
        </div>
        
        <div class="content">
            <p>Hello Student,</p>
            <p>Great news! ${creator.name} has just created a new experiment for you to explore.</p>
            
            <div class="experiment-card">
                <h2 class="experiment-title">${experiment.title}</h2>
                <div class="experiment-meta">
                    ${experiment.subject ? `<span class="meta-item">📚 ${experiment.subject}</span>` : ''}
                    ${experiment.difficulty ? `<span class="meta-item">⚡ ${experiment.difficulty}</span>` : ''}
                    <span class="meta-item">🕐 ${new Date(experiment.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            
            <p>This experiment includes:</p>
            <ul>
                <li>✅ Detailed procedure and theory</li>
                <li>✅ Interactive simulations</li>
                <li>✅ AI-powered guidance</li>
                <li>✅ Quiz and assessment</li>
            </ul>
            
            <center>
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/experiment/${experiment._id}" class="cta-button">
                    Start Experiment →
                </a>
            </center>
            
            <div class="creator-info">
                <strong>Created by:</strong> ${creator.name}<br>
                <strong>Email:</strong> ${creator.email}
            </div>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} AISLA - AI Self-Learning Lab Assistant</p>
            <p>
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard">Dashboard</a> | 
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/experiments">All Experiments</a>
            </p>
            <p style="margin-top: 10px; font-size: 11px;">
                You're receiving this email because you're enrolled in AISLA.<br>
                If you have any questions, please contact your instructor.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        // Plain text version
        const textContent = `
New Experiment Available: ${experiment.title}

Hello Student,

${creator.name} has created a new experiment for you.

Experiment Details:
- Title: ${experiment.title}
${experiment.subject ? `- Subject: ${experiment.subject}` : ''}
${experiment.difficulty ? `- Difficulty: ${experiment.difficulty}` : ''}
- Created: ${new Date(experiment.createdAt).toLocaleDateString()}

Created by: ${creator.name} (${creator.email})

Access the experiment at: ${process.env.CLIENT_URL || 'http://localhost:3000'}/experiment/${experiment._id}

---
AISLA - AI Self-Learning Lab Assistant
        `;

        return await sendBulkEmail(studentEmails, subject, htmlContent, textContent);
    } catch (error) {
        console.error('Error sending new experiment notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send welcome email to new user
 * @param {String} email - User email
 * @param {String} name - User name
 * @param {String} role - User role
 */
const sendWelcomeEmail = async (email, name, role) => {
    try {
        const subject = '🎉 Welcome to AISLA - AI Self-Learning Lab Assistant!';
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .cta-button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to AISLA! 🚀</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>Welcome to AISLA - AI Self-Learning Lab Assistant! Your account has been successfully created as a <strong>${role}</strong>.</p>
            <p>Get started with AI-powered experiments, simulations, and interactive learning.</p>
            <center>
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" class="cta-button">Go to Dashboard</a>
            </center>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} AISLA. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;

        const textContent = `Welcome to AISLA!\n\nHi ${name},\n\nYour account has been created as a ${role}.\n\nVisit: ${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`;

        return await sendBulkEmail([email], subject, htmlContent, textContent);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error: error.message };
    }
};

export default {
    sendBulkEmail,
    sendNewExperimentNotification,
    sendWelcomeEmail
};
