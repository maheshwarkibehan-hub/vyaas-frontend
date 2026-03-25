import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Only create client if valid URL (skip in build if missing env)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Initialize Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export async function POST(req: Request) {
    try {
        const { title, message, targetUserId, type, adminEmail } = await req.json();

        // Simple Admin Check
        if (adminEmail !== 'maheshwarkibehan@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        let recipients: { id: string; email?: string }[] = [];

        if (targetUserId) {
            // Send to Specific User
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, email')
                .eq('id', targetUserId)
                .single();
            if (error) throw error;
            if (userData) {
                recipients.push({ id: userData.id, email: userData.email });
            }
        } else {
            // Send to ALL Users (Broadcast)
            const { data: usersData, error } = await supabase
                .from('users')
                .select('id, email');
            if (error) throw error;
            if (usersData) {
                recipients = usersData.map(u => ({ id: u.id, email: u.email }));
            }
        }


        if (recipients.length === 0) {
            return NextResponse.json({ message: 'No recipients found' });
        }

        // 1. Insert Notifications into Database
        const notifications = recipients.map(r => ({
            user_id: r.id,
            title: `📢 ${title}`,
            message: `✨ ${message}`,
            type: type || 'info',
            is_read: false
        }));

        const { error: dbError } = await supabase
            .from('user_notifications')
            .insert(notifications);

        if (dbError) throw dbError;

        // 2. Send Emails (Fire and Forget / Parallel)
        const emailPromises = recipients.map(r => {
            if (!r.email) return Promise.resolve();

            return transporter.sendMail({
                from: `"VYAAS AI Team" <${process.env.GMAIL_USER}>`,
                to: r.email,
                subject: `📢 ${title}`,
                html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f4f4f5; color: #333;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">VYAAS AI</h1>
              </div>
              
              <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
              
              <div style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 20px 0;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <div style="text-align: center; font-size: 12px; color: #9ca3af;">
                <p>&copy; 2025 VYAAS AI. All rights reserved.</p>
                <p>This is an automated message. Please do not reply.</p>
              </div>
            </div>
          </div>
        `
            }).catch(err => console.error(`Failed to send email to ${r.email}:`, err));
        });

        // Wait for emails to be sent (or at least attempted)
        await Promise.allSettled(emailPromises);

        return NextResponse.json({ success: true, count: recipients.length });

    } catch (err) {
        const error = err as Error;
        console.error('Broadcast API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
