import nodemailer from 'nodemailer';

// Gmail SMTP Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

interface InvoiceData {
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerEmail: string;
    planName: string;
    credits: number;
    amount: number;
    discount: number;
    tax: number;
    total: number;
    couponCode?: string;
}

export async function sendApprovalEmail(email: string, invoiceData: InvoiceData) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 32px; font-weight: bold; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; }
        .content { padding: 40px 30px; }
        .success-badge { background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: bold; margin-bottom: 20px; }
        .invoice-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
        .invoice-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .invoice-row.total { font-size: 20px; font-weight: bold; color: #667eea; border-bottom: none; margin-top: 12px; padding-top: 16px; border-top: 2px solid #667eea; }
        .plan-details { background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 8px; margin: 20px 0; }
        .plan-details h3 { margin: 0 0 12px 0; color: #667eea; }
        .plan-details ul { margin: 0; padding-left: 20px; }
        .plan-details li { margin: 8px 0; color: #4b5563; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 VYAAS AI</h1>
            <p>Your AI-Powered Assistant Platform</p>
        </div>
        
        <div class="content">
            <div class="success-badge">✅ Payment Approved!</div>
            
            <h2 style="color: #1f2937; margin-bottom: 16px;">Hello ${invoiceData.customerName},</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
                Great news! Your payment has been successfully approved. Your account has been upgraded and credits have been added.
            </p>
            
            <div class="plan-details">
                <h3>📦 Plan Details</h3>
                <ul>
                    <li><strong>Plan:</strong> ${invoiceData.planName}</li>
                    <li><strong>Credits:</strong> ${invoiceData.credits} Credits</li>
                    <li><strong>Status:</strong> Active</li>
                </ul>
            </div>
            
            <div class="invoice-box">
                <div class="invoice-header">
                    <div>
                        <h3 style="margin: 0; color: #1f2937;">INVOICE</h3>
                        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">#${invoiceData.invoiceNumber}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Date</p>
                        <p style="margin: 4px 0 0 0; color: #1f2937; font-weight: bold;">${invoiceData.date}</p>
                    </div>
                </div>
                
                <div class="invoice-row">
                    <span style="color: #6b7280;">Plan (${invoiceData.planName})</span>
                    <span style="font-weight: 600;">₹${invoiceData.amount}</span>
                </div>
                
                ${invoiceData.discount > 0 ? `
                <div class="invoice-row">
                    <span style="color: #10b981;">Discount ${invoiceData.couponCode ? `(${invoiceData.couponCode})` : ''}</span>
                    <span style="color: #10b981; font-weight: 600;">-₹${invoiceData.discount}</span>
                </div>
                ` : ''}
                
                <div class="invoice-row">
                    <span style="color: #6b7280;">Tax (18% GST)</span>
                    <span style="font-weight: 600;">₹${invoiceData.tax}</span>
                </div>
                
                <div class="invoice-row total">
                    <span>Total Amount</span>
                    <span>₹${invoiceData.total}</span>
                </div>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-top: 24px;">
                You can now enjoy all the premium features of VYAAS AI. If you have any questions, feel free to reach out to our support team.
            </p>
            
            <center>
                <a href="https://vyaas.ai/dashboard" class="button">Go to Dashboard</a>
            </center>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 8px 0;"><strong>VYAAS AI</strong></p>
            <p style="margin: 0;">Thank you for choosing VYAAS AI!</p>
            <p style="margin: 12px 0 0 0; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await transporter.sendMail({
            from: `"VYAAS AI" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `✅ Payment Approved - Invoice #${invoiceData.invoiceNumber}`,
            html: htmlContent,
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
}

export async function sendRejectionEmail(email: string, customerName: string, amount: number, reason?: string) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 32px; font-weight: bold; }
        .content { padding: 40px 30px; }
        .warning-badge { background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: bold; margin-bottom: 20px; }
        .info-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 VYAAS AI</h1>
        </div>
        
        <div class="content">
            <div class="warning-badge">❌ Payment Request Rejected</div>
            
            <h2 style="color: #1f2937; margin-bottom: 16px;">Hello ${customerName},</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
                We regret to inform you that your payment request for ₹${amount} has been rejected.
            </p>
            
            ${reason ? `
            <div class="info-box">
                <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
            </div>
            ` : ''}
            
            <p style="color: #4b5563; line-height: 1.6;">
                If you believe this is a mistake or need assistance, please contact our support team. We're here to help!
            </p>
            
            <center>
                <a href="mailto:${process.env.GMAIL_USER}" class="button">Contact Support</a>
            </center>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 8px 0;"><strong>VYAAS AI</strong></p>
            <p style="margin: 0;">${process.env.GMAIL_USER}</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await transporter.sendMail({
            from: `"VYAAS AI" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '❌ Payment Request Update - VYAAS AI',
            html: htmlContent,
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
}
