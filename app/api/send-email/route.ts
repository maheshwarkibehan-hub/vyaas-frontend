import { NextRequest, NextResponse } from 'next/server';
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, email, data } = body;

        if (type === 'approval') {
            const success = await sendApprovalEmail(email, data);
            return NextResponse.json({ success });
        } else if (type === 'rejection') {
            const success = await sendRejectionEmail(email, data.customerName, data.amount, data.reason);
            return NextResponse.json({ success });
        }

        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Email API error:', error);
        return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
    }
}
