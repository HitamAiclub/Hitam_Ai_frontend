import { Zap, Shield, Info, Type } from 'lucide-react';

export const MAIL_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard',
    icon: Type,
    subject: 'Registration Received: [Event Name]',
    body: `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
    <h2 style="color: #10b981;">Registration Received! 🎉</h2>
    <p>Hello <strong>[Participant Name]</strong>,</p>
    <p>Thank you for registering for <strong>'[Event Name]'</strong>. We have successfully received your information.</p>
    
    <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0; font-family: monospace;"><strong>Registration ID:</strong> [Registration ID]</p>
    </div>

    <div style="margin: 25px 0; padding: 24px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
        <p style="margin: 0 0 10px 0; color: #166534; font-weight: bold; font-size: 16px;">What's Next?</p>
        <ul style="margin: 0; color: #166534; padding-left: 20px;">
            <li>Our team will review your details.</li>
            <li>Official entry tickets will be sent closer to the event.</li>
        </ul>
    </div>
    <p>Best Regards,<br><strong>The HITAM AI CLUB Team</strong></p>
</div>`
  },
  {
    id: 'hype',
    name: 'Exciting',
    icon: Zap,
    subject: 'YOU ARE IN! 🚀 [Event Name] Registration',
    body: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; border: 2px solid #3b82f6; border-radius: 20px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">GET READY! 🚀</h1>
    </div>
    <div style="padding: 30px; background: white;">
        <p style="font-size: 18px;">Hey <strong>[Participant Name]</strong>!</p>
        <p>Your spot for <strong>[Event Name]</strong> is officially secured. We are super excited to have you join us for this high-energy session!</p>
        <div style="margin: 30px 0; padding: 24px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;">
            <p style="margin: 0; font-weight: bold; color: #1e40af;">Don't forget to:</p>
            <ul style="margin-top: 10px; color: #1e40af; padding-left: 20px;">
                <li>Bring your laptop & charger</li>
                <li>Invite your friends</li>
                <li>Stay curious!</li>
            </ul>
        </div>
        <p style="text-align: center; margin-top: 30px;">See you at the event! 🔥</p>
    </div>
</div>`
  },
  {
    id: 'instructions',
    name: 'Instructions',
    icon: Info,
    subject: 'Important Steps: [Event Name] Registration',
    body: `<div style="font-family: sans-serif; color: #4b5563; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 24px; background: white;">
    <h2 style="color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-bottom: 24px;">Registration Confirmed</h2>
    <p>Hello [Participant Name],</p>
    <p>We've received your registration for <strong>[Event Name]</strong>. Please follow these important steps to ensure a smooth experience:</p>
    
    <div style="margin: 24px 0; padding: 24px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px;">
        <p style="margin: 0; color: #5b21b6; font-weight: bold;">Step 1: Join the Community</p>
        <p style="margin: 5px 0 15px 0; font-size: 13px;">Click the link in the registration success page to join our official WhatsApp/Discord group.</p>
        
        <p style="margin: 0; color: #5b21b6; font-weight: bold;">Step 2: Check Pre-requisites</p>
        <p style="margin: 5px 0 0 0; font-size: 13px;">Review the activity description for any software, tools, or prior knowledge you need.</p>
    </div>

    <div style="background: #fff7ed; padding: 15px; border-radius: 8px; border: 1px solid #fdba74; color: #c2410c; font-size: 13px; text-align: center;">
        <strong>Entry Note:</strong> Entry will be granted only to registered participants.
    </div>
</div>`
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Shield,
    subject: 'Official Confirmation: [Event Name]',
    body: `<div style="font-family: 'Times New Roman', Times, serif; color: #000; max-width: 650px; margin: 0 auto; padding: 40px; border: 1px solid #000;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="text-transform: uppercase; letter-spacing: 2px;">HITAM AI CLUB</h2>
        <div style="width: 100px; height: 1px; background: #000; margin: 10px auto;"></div>
    </div>
    <p>Dear [Participant Name],</p>
    <p>This is an official confirmation regarding your registration for the session titled <strong>"[Event Name]"</strong>.</p>
    <p>We have documented your participation request. Further logistical details, including session timings and venue specifications (if applicable), will be formally communicated through this email channel.</p>
    <p>Should you require any scholarly assistance or have administrative inquiries, please do not hesitate to contact our secretariat.</p>
    <p style="margin-top: 40px;">Sincerely,<br><strong>Administrative Division</strong><br>HITAM AI CLUB</p>
</div>`
  }
];

export const THEMED_BOXES = {
  green: {
    name: 'Next Steps (Green)',
    class: 'bg-green-50 text-green-800 border-green-200',
    html: `<div style="margin: 25px 0; padding: 24px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
        <p style="margin: 0 0 10px 0; color: #166534; font-weight: bold; font-size: 16px;">What's Next?</p>
        <ul style="margin: 0; color: #166534; padding-left: 20px;">
            <li>Step 1 description here...</li>
            <li>Step 2 description here...</li>
        </ul>
    </div>`
  },
  blue: {
    name: 'General Info (Blue)',
    class: 'bg-blue-50 text-blue-800 border-blue-200',
    html: `<div style="margin: 25px 0; padding: 24px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;">
        <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold; font-size: 16px;">Important Information</p>
        <p style="margin: 0; color: #1e40af; font-size: 14px;">Enter your informational text about the event details or logistics here.</p>
    </div>`
  },
  orange: {
    name: 'Quick Note (Orange)',
    class: 'bg-orange-50 text-orange-800 border-orange-200',
    html: `<div style="margin: 25px 0; padding: 20px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; text-align: center; color: #c2410c; font-size: 14px;">
        <strong>Note:</strong> Enter a quick disclaimer or rule here.
    </div>`
  }
};
