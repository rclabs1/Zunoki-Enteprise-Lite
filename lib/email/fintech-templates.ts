/**
 * 📧 COMPREHENSIVE EMAIL TEMPLATES FOR FINTECH/INSURANCE CLIENTS
 * Handholding email sequences for customer onboarding and lifecycle management
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
  variables: string[];
  category: 'welcome' | 'onboarding' | 'kyc' | 'product' | 'support' | 'retention' | 'compliance';
  trigger_conditions?: string[];
}

export interface EmailSequence {
  name: string;
  description: string;
  total_emails: number;
  duration_days: number;
  product_type: 'insurance' | 'investment' | 'loan' | 'subscription' | 'all';
  emails: Array<{
    day: number;
    template_key: string;
    trigger_conditions?: string[];
    personalization_rules?: any;
  }>;
}

/**
 * 🎯 EMAIL TEMPLATES FOR FINTECH/INSURANCE WORKFLOWS
 */
export const fintechEmailTemplates: Record<string, EmailTemplate> = {
  // WELCOME & ONBOARDING TEMPLATES
  payment_success_immediate: {
    subject: "✅ Payment Confirmed - Welcome to {{product_name}}!",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Payment Confirmed! 🎉</h1>
        <p style="color: #e8e8e8; margin: 10px 0 0 0; font-size: 16px;">Welcome to your financial journey with us</p>
      </div>

      <div style="background: white; padding: 40px 30px;">
        <h2 style="color: #333; margin-bottom: 20px;">Hi {{customer_name}},</h2>

        <div style="background: #f0f8ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Payment Details</h3>
          <p><strong>Amount:</strong> {{currency}} {{amount}}</p>
          <p><strong>Product:</strong> {{product_type}} - {{plan_type}} Plan</p>
          <p><strong>Payment ID:</strong> {{payment_id}}</p>
          <p><strong>Date:</strong> {{date}}</p>
        </div>

        <h3 style="color: #333; margin-top: 30px;">What happens next?</h3>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0 0 15px 0;"><strong>📋 Step 1:</strong> Complete your verification (KYC) process</p>
          <p style="margin: 0 0 15px 0;"><strong>🏭 Step 2:</strong> We'll set up your account and policies</p>
          <p style="margin: 0 0 15px 0;"><strong>📱 Step 3:</strong> Access your customer portal</p>
          <p style="margin: 0;"><strong>🎯 Step 4:</strong> Start using your {{product_type}} benefits</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{customer_portal_url}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Access Your Portal</a>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>💡 Pro Tip:</strong> Keep this email for your records. You'll need your Payment ID for any support inquiries.</p>
        </div>

        <p style="margin-top: 30px;">Need help? Our support team is here for you 24/7.</p>
        <p style="margin: 5px 0;">📞 Phone: {{support_phone}}</p>
        <p style="margin: 5px 0;">📧 Email: {{support_email}}</p>
        <p style="margin: 5px 0;">💬 WhatsApp: {{whatsapp_number}}</p>
      </div>

      <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0;">Thank you for trusting us with your financial future!</p>
      </div>
    </div>`,
    text: `Payment Confirmed! Welcome to {{product_name}}!

Hi {{customer_name}},

Your payment has been successfully processed:
- Amount: {{currency}} {{amount}}
- Product: {{product_type}} - {{plan_type}} Plan
- Payment ID: {{payment_id}}
- Date: {{date}}

What happens next?
1. Complete your verification (KYC) process
2. We'll set up your account and policies
3. Access your customer portal
4. Start using your {{product_type}} benefits

Access your portal: {{customer_portal_url}}

Need help? Contact us:
Phone: {{support_phone}}
Email: {{support_email}}
WhatsApp: {{whatsapp_number}}

Thank you for trusting us with your financial future!`,
    variables: ['customer_name', 'product_name', 'currency', 'amount', 'product_type', 'plan_type', 'payment_id', 'date', 'customer_portal_url', 'support_phone', 'support_email', 'whatsapp_number'],
    category: 'welcome'
  },

  welcome_insurance: {
    subject: "🛡️ Welcome to Your Insurance Journey - {{product_name}}",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🛡️ You're Now Protected!</h1>
        <p style="color: #e8e8e8; margin: 10px 0 0 0;">Your {{product_type}} insurance is being processed</p>
      </div>

      <div style="background: white; padding: 40px 30px;">
        <h2 style="color: #333;">Dear {{customer_name}},</h2>

        <p>Congratulations on taking this important step to protect yourself and your loved ones. Your {{product_type}} insurance application is now being processed.</p>

        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #155724;">Your Protection Details</h3>
          <p style="margin: 5px 0;"><strong>Policy Type:</strong> {{product_type}} Insurance</p>
          <p style="margin: 5px 0;"><strong>Coverage Amount:</strong> {{currency}} {{coverage_amount}}</p>
          <p style="margin: 5px 0;"><strong>Premium:</strong> {{currency}} {{premium_amount}} {{payment_frequency}}</p>
          <p style="margin: 5px 0;"><strong>Effective Date:</strong> {{effective_date}}</p>
        </div>

        <h3 style="color: #333;">Complete Your Application</h3>
        <p>To activate your coverage, please complete these simple steps:</p>

        <div style="margin: 20px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <span style="background: #28a745; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">1</span>
            <span>Upload your identification documents</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <span style="background: #28a745; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">2</span>
            <span>Complete your health questionnaire</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <span style="background: #28a745; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">3</span>
            <span>Review and sign your policy documents</span>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{application_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Application</a>
        </div>

        <div style="background: #e2e3e5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #333;">📱 Stay Connected</h4>
          <p style="margin: 0;">We'll send you updates via WhatsApp and email. You can also track your application status in your customer portal.</p>
        </div>
      </div>
    </div>`,
    text: `Welcome to Your Insurance Journey!

Dear {{customer_name}},

Your {{product_type}} insurance application is being processed.

Protection Details:
- Policy Type: {{product_type}} Insurance
- Coverage: {{currency}} {{coverage_amount}}
- Premium: {{currency}} {{premium_amount}} {{payment_frequency}}
- Effective Date: {{effective_date}}

Complete your application:
1. Upload identification documents
2. Complete health questionnaire
3. Review and sign policy documents

Complete Application: {{application_url}}

We'll keep you updated via WhatsApp and email.`,
    variables: ['customer_name', 'product_type', 'currency', 'coverage_amount', 'premium_amount', 'payment_frequency', 'effective_date', 'application_url'],
    category: 'onboarding'
  },

  kyc_reminder: {
    subject: "⏰ Action Required: Complete Your Verification - {{days_remaining}} Days Left",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ff6b35; padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">⏰ Verification Needed</h1>
        <p style="color: #ffe8e8; margin: 10px 0 0 0;">Complete your KYC to activate your account</p>
      </div>

      <div style="background: white; padding: 40px 30px;">
        <h2 style="color: #333;">Hi {{customer_name}},</h2>

        <div style="background: #fff3cd; border-left: 4px solid #ff6b35; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">Action Required: {{days_remaining}} Days Remaining</h3>
          <p style="margin: 0;">Your {{product_type}} account is waiting for verification. Complete your KYC process to activate all features and start using your benefits.</p>
        </div>

        <h3 style="color: #333;">What You Need to Upload:</h3>
        <div style="margin: 20px 0;">
          {{#each required_documents}}
          <div style="padding: 15px; margin: 10px 0; border: 1px solid #dee2e6; border-radius: 5px; background: #f8f9fa;">
            <h4 style="margin: 0 0 5px 0; color: #333;">{{this.type}}</h4>
            <p style="margin: 0; color: #666; font-size: 14px;">{{this.description}}</p>
          </div>
          {{/each}}
        </div>

        <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #0066cc;">🔒 Your Security Matters</h4>
          <p style="margin: 0; color: #0066cc;">All documents are encrypted and stored securely. We comply with all data protection regulations.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{kyc_upload_url}}" style="background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Upload Documents Now</a>
        </div>

        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #721c24;"><strong>⚠️ Important:</strong> Your account will be suspended if verification is not completed within {{days_remaining}} days.</p>
        </div>
      </div>
    </div>`,
    text: `Verification Needed - {{days_remaining}} Days Left

Hi {{customer_name}},

Your {{product_type}} account needs verification. Complete your KYC process to activate all features.

Required Documents:
{{#each required_documents}}
- {{this.type}}: {{this.description}}
{{/each}}

Upload documents: {{kyc_upload_url}}

Important: Account will be suspended if not completed within {{days_remaining}} days.`,
    variables: ['customer_name', 'product_type', 'days_remaining', 'required_documents', 'kyc_upload_url'],
    category: 'kyc',
    trigger_conditions: ['kyc_incomplete', 'days_since_signup_gt_1']
  },

  insurance_quote_followup: {
    subject: "💰 Your Insurance Quote Expires Soon - {{product_type}} Coverage",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">💰 Your Quote is Ready!</h1>
        <p style="color: #e8e8e8; margin: 10px 0 0 0;">Personalized {{product_type}} insurance quote</p>
      </div>

      <div style="background: white; padding: 40px 30px;">
        <h2 style="color: #333;">Hi {{customer_name}},</h2>

        <p>Good news! Your personalized {{product_type}} insurance quote is ready. We've calculated the best coverage options based on your profile.</p>

        <div style="background: #f0f8ff; border: 1px solid #b3d9ff; padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 20px 0; color: #333; text-align: center;">Your Personalized Quote</h3>

          <div style="background: white; padding: 20px; border-radius: 5px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: bold;">Coverage Amount:</span>
              <span style="color: #28a745; font-weight: bold; font-size: 18px;">{{currency}} {{coverage_amount}}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: bold;">Monthly Premium:</span>
              <span style="color: #6c5ce7; font-weight: bold; font-size: 18px;">{{currency}} {{monthly_premium}}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: bold;">Annual Savings:</span>
              <span style="color: #28a745; font-weight: bold;">{{currency}} {{annual_savings}}</span>
            </div>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <p style="margin: 0; color: #856404; font-weight: bold;">⏰ Quote expires in {{days_until_expiry}} days</p>
          </div>
        </div>

        <h3 style="color: #333;">What's Included:</h3>
        <div style="margin: 20px 0;">
          {{#each coverage_benefits}}
          <div style="padding: 10px; margin: 8px 0; background: #f8f9fa; border-left: 3px solid #28a745; border-radius: 3px;">
            <span style="color: #28a745; margin-right: 10px;">✓</span>{{this}}
          </div>
          {{/each}}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{quote_url}}" style="background: #6c5ce7; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">View Full Quote</a>
          <a href="{{purchase_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Buy Now</a>
        </div>

        <div style="background: #e2e3e5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #333;">💬 Questions? We're Here to Help</h4>
          <p style="margin: 0;">Schedule a free consultation with our insurance experts. We'll explain your coverage options and help you choose the best plan.</p>
          <p style="margin: 10px 0 0 0;"><a href="{{consultation_url}}" style="color: #6c5ce7; text-decoration: none; font-weight: bold;">Schedule Free Consultation →</a></p>
        </div>
      </div>
    </div>`,
    text: `Your Insurance Quote is Ready!

Hi {{customer_name}},

Your personalized {{product_type}} insurance quote:

Coverage Amount: {{currency}} {{coverage_amount}}
Monthly Premium: {{currency}} {{monthly_premium}}
Annual Savings: {{currency}} {{annual_savings}}

Quote expires in {{days_until_expiry}} days.

What's included:
{{#each coverage_benefits}}
✓ {{this}}
{{/each}}

View quote: {{quote_url}}
Buy now: {{purchase_url}}
Schedule consultation: {{consultation_url}}`,
    variables: ['customer_name', 'product_type', 'currency', 'coverage_amount', 'monthly_premium', 'annual_savings', 'days_until_expiry', 'coverage_benefits', 'quote_url', 'purchase_url', 'consultation_url'],
    category: 'product'
  },

  onboarding_week_1: {
    subject: "🚀 Week 1: Getting Started with Your {{product_type}} Account",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🚀 Welcome to Week 1!</h1>
        <p style="color: #e8e8e8; margin: 10px 0 0 0;">Your {{product_type}} journey has begun</p>
      </div>

      <div style="background: white; padding: 40px 30px;">
        <h2 style="color: #333;">Hi {{customer_name}},</h2>

        <p>Welcome to your first week! You've successfully completed your payment and verification. Now let's get you familiar with your new {{product_type}} benefits.</p>

        <div style="background: #d1f2eb; border: 1px solid #7bdcb5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #00695c;">✅ What You've Accomplished</h3>
          <div style="margin: 10px 0;">
            <span style="color: #00695c; margin-right: 10px;">✓</span>Payment processed successfully
          </div>
          <div style="margin: 10px 0;">
            <span style="color: #00695c; margin-right: 10px;">✓</span>Account verification completed
          </div>
          <div style="margin: 10px 0;">
            <span style="color: #00695c; margin-right: 10px;">✓</span>Welcome to our family!
          </div>
        </div>

        <h3 style="color: #333;">This Week's Focus: Getting Familiar</h3>

        <div style="margin: 25px 0;">
          <div style="border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 15px; overflow: hidden;">
            <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6;">
              <h4 style="margin: 0; color: #333;">📱 Explore Your Customer Portal</h4>
            </div>
            <div style="padding: 15px;">
              <p style="margin: 0 0 10px 0;">Your personalized dashboard is ready! Access your policy documents, track claims, and manage your account.</p>
              <a href="{{portal_url}}" style="color: #00b894; text-decoration: none; font-weight: bold;">Access Portal →</a>
            </div>
          </div>

          <div style="border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 15px; overflow: hidden;">
            <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6;">
              <h4 style="margin: 0; color: #333;">📚 Download Our Mobile App</h4>
            </div>
            <div style="padding: 15px;">
              <p style="margin: 0 0 10px 0;">Manage everything on the go. File claims, pay premiums, and get instant support.</p>
              <a href="{{app_download_url}}" style="color: #00b894; text-decoration: none; font-weight: bold;">Download App →</a>
            </div>
          </div>

          <div style="border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 15px; overflow: hidden;">
            <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6;">
              <h4 style="margin: 0; color: #333;">🎓 Take Our Quick Tutorial</h4>
            </div>
            <div style="padding: 15px;">
              <p style="margin: 0 0 10px 0;">5-minute guided tour of your benefits and how to use them effectively.</p>
              <a href="{{tutorial_url}}" style="color: #00b894; text-decoration: none; font-weight: bold;">Start Tutorial →</a>
            </div>
          </div>
        </div>

        <div style="background: #fff3e0; border: 1px solid #ffcc80; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #ef6c00;">📞 Your Dedicated Support</h4>
          <p style="margin: 0 0 10px 0; color: #ef6c00;">Need help getting started? Your onboarding specialist {{specialist_name}} is here to help.</p>
          <p style="margin: 0; color: #ef6c00;"><strong>Direct Line:</strong> {{specialist_phone}}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="margin: 0 0 15px 0; font-weight: bold;">Coming Next Week:</p>
          <p style="margin: 0; color: #666;">Advanced features, optimization tips, and exclusive member benefits</p>
        </div>
      </div>
    </div>`,
    text: `Welcome to Week 1!

Hi {{customer_name}},

You've successfully completed payment and verification. Let's get familiar with your {{product_type}} benefits.

What you've accomplished:
✓ Payment processed
✓ Account verification completed
✓ Welcome to our family!

This week's focus:
1. Explore your customer portal: {{portal_url}}
2. Download our mobile app: {{app_download_url}}
3. Take our quick tutorial: {{tutorial_url}}

Your onboarding specialist: {{specialist_name}}
Direct line: {{specialist_phone}}

Coming next week: Advanced features and exclusive benefits!`,
    variables: ['customer_name', 'product_type', 'portal_url', 'app_download_url', 'tutorial_url', 'specialist_name', 'specialist_phone'],
    category: 'onboarding',
    trigger_conditions: ['days_since_payment_eq_7', 'kyc_verified']
  },

  customer_at_risk_retention: {
    subject: "🎁 Special Offer Just for You - {{customer_name}}",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #e84393 0%, #fd79a8 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎁 Something Special for You</h1>
        <p style="color: #ffe8e8; margin: 10px 0 0 0;">Because you're valued</p>
      </div>

      <div style="background: white; padding: 40px 30px;">
        <h2 style="color: #333;">Dear {{customer_name}},</h2>

        <p>We've noticed you haven't been as active with your {{product_type}} account lately, and we want to make sure you're getting the most value from your membership.</p>

        <div style="background: #ffe8f1; border: 1px solid #ff8fab; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <h3 style="margin: 0 0 15px 0; color: #e84393;">🎁 Exclusive Offer: {{offer_percentage}}% Off</h3>
          <p style="margin: 0 0 15px 0; font-size: 18px; color: #333;">Valid for {{offer_duration}} days only</p>
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; font-weight: bold; color: #e84393; font-size: 20px;">Save {{currency}} {{savings_amount}}</p>
            <p style="margin: 5px 0 0 0; color: #666;">on your next premium payment</p>
          </div>
        </div>

        <h3 style="color: #333;">Why We Value You:</h3>
        <div style="margin: 20px 0;">
          <div style="padding: 15px; margin: 10px 0; background: #f8f9fa; border-left: 3px solid #e84393; border-radius: 3px;">
            <span style="color: #e84393; margin-right: 10px;">💎</span>You've been with us for {{tenure_months}} months
          </div>
          <div style="padding: 15px; margin: 10px 0; background: #f8f9fa; border-left: 3px solid #e84393; border-radius: 3px;">
            <span style="color: #e84393; margin-right: 10px;">🌟</span>You're part of our premium member community
          </div>
          <div style="padding: 15px; margin: 10px 0; background: #f8f9fa; border-left: 3px solid #e84393; border-radius: 3px;">
            <span style="color: #e84393; margin-right: 10px;">🛡️</span>You trust us to protect what matters most
          </div>
        </div>

        <div style="background: #f0f8ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 15px 0; color: #0066cc;">🆕 New Features You Might Have Missed:</h4>
          {{#each new_features}}
          <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 3px;">
            <strong>{{this.name}}:</strong> {{this.description}}
          </div>
          {{/each}}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{claim_offer_url}}" style="background: #e84393; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Claim Your {{offer_percentage}}% Discount</a>
          <a href="{{contact_advisor_url}}" style="background: #74b9ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Talk to an Advisor</a>
        </div>

        <div style="background: #e8f6f3; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #00695c;">💬 We're Here to Listen</h4>
          <p style="margin: 0;">If something isn't working for you, we want to know. Your feedback helps us improve and serve you better.</p>
        </div>

        <p style="margin-top: 30px; color: #666; font-style: italic;">This offer is exclusive to you and expires in {{offer_duration}} days. We hope to continue serving you for many years to come.</p>
      </div>
    </div>`,
    text: `Special Offer Just for You

Dear {{customer_name}},

We've noticed you haven't been as active lately. Here's an exclusive offer just for you:

🎁 {{offer_percentage}}% Off - Save {{currency}} {{savings_amount}}
Valid for {{offer_duration}} days only

Why we value you:
💎 {{tenure_months}} months with us
🌟 Premium member
🛡️ Trust us to protect what matters

New features you might have missed:
{{#each new_features}}
- {{this.name}}: {{this.description}}
{{/each}}

Claim discount: {{claim_offer_url}}
Talk to advisor: {{contact_advisor_url}}

Offer expires in {{offer_duration}} days.`,
    variables: ['customer_name', 'product_type', 'offer_percentage', 'offer_duration', 'currency', 'savings_amount', 'tenure_months', 'new_features', 'claim_offer_url', 'contact_advisor_url'],
    category: 'retention',
    trigger_conditions: ['churn_probability_gt_0.6', 'last_login_gt_30_days']
  },

  compliance_document_request: {
    subject: "📋 Important: Compliance Documents Required - Action Needed",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6c5ce7 0%, #74b9ff 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">📋 Document Update Required</h1>
        <p style="color: #e8e8e8; margin: 10px 0 0 0;">Regulatory compliance update</p>
      </div>

      <div style="background: white; padding: 40px 30px;">
        <h2 style="color: #333;">Dear {{customer_name}},</h2>

        <p>As part of our commitment to regulatory compliance and protecting your account, we need you to update some documents in your profile.</p>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">⚠️ Action Required by {{deadline_date}}</h3>
          <p style="margin: 0;">This is a regulatory requirement. Failure to provide documents by the deadline may result in temporary account restrictions.</p>
        </div>

        <h3 style="color: #333;">Documents Needed:</h3>
        <div style="margin: 20px 0;">
          {{#each required_documents}}
          <div style="border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 15px; overflow: hidden;">
            <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6;">
              <h4 style="margin: 0; color: #333;">{{this.type}}</h4>
            </div>
            <div style="padding: 15px;">
              <p style="margin: 0 0 10px 0; color: #666;">{{this.description}}</p>
              <p style="margin: 0; font-size: 14px; color: #6c757d;"><strong>Format:</strong> {{this.format}} | <strong>Max Size:</strong> {{this.max_size}}</p>
            </div>
          </div>
          {{/each}}
        </div>

        <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #0066cc;">🔐 Security & Privacy</h4>
          <ul style="margin: 0; color: #0066cc; padding-left: 20px;">
            <li>All documents are encrypted during transmission</li>
            <li>Files are stored in secure, compliant servers</li>
            <li>Access is restricted to authorized personnel only</li>
            <li>Documents are retained per regulatory requirements</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{upload_url}}" style="background: #6c5ce7; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Upload Documents</a>
        </div>

        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #721c24;">Important Deadline</h4>
          <p style="margin: 0; color: #721c24;">Documents must be submitted by <strong>{{deadline_date}}</strong>. After this date, your account may be temporarily restricted until compliance is restored.</p>
        </div>

        <h3 style="color: #333;">Need Help?</h3>
        <p>Our compliance team is available to assist you:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>📞 Phone:</strong> {{compliance_phone}}</p>
          <p style="margin: 5px 0;"><strong>📧 Email:</strong> {{compliance_email}}</p>
          <p style="margin: 5px 0;"><strong>⏰ Hours:</strong> Monday-Friday, 9 AM - 6 PM</p>
        </div>
      </div>
    </div>`,
    text: `Document Update Required - Compliance

Dear {{customer_name}},

We need you to update documents for regulatory compliance.

⚠️ Action required by {{deadline_date}}

Documents needed:
{{#each required_documents}}
- {{this.type}}: {{this.description}}
  Format: {{this.format}} | Max Size: {{this.max_size}}
{{/each}}

Security & Privacy:
- All documents encrypted
- Secure, compliant storage
- Restricted access
- Regulatory retention

Upload documents: {{upload_url}}

Need help?
Phone: {{compliance_phone}}
Email: {{compliance_email}}
Hours: Monday-Friday, 9 AM - 6 PM`,
    variables: ['customer_name', 'deadline_date', 'required_documents', 'upload_url', 'compliance_phone', 'compliance_email'],
    category: 'compliance',
    trigger_conditions: ['compliance_review_due', 'regulatory_requirement']
  }
};

/**
 * 📧 EMAIL SEQUENCES FOR CUSTOMER LIFECYCLE
 */
export const fintechEmailSequences: Record<string, EmailSequence> = {
  insurance_onboarding: {
    name: "Insurance Customer Onboarding",
    description: "Complete 30-day onboarding sequence for new insurance customers",
    total_emails: 8,
    duration_days: 30,
    product_type: "insurance",
    emails: [
      { day: 0, template_key: "payment_success_immediate" },
      { day: 1, template_key: "welcome_insurance" },
      { day: 3, template_key: "kyc_reminder", trigger_conditions: ["kyc_incomplete"] },
      { day: 7, template_key: "onboarding_week_1", trigger_conditions: ["kyc_verified"] },
      { day: 14, template_key: "product_tutorial", trigger_conditions: ["portal_not_accessed"] },
      { day: 21, template_key: "satisfaction_survey" },
      { day: 28, template_key: "month_one_tips" },
      { day: 60, template_key: "policy_review_reminder" }
    ]
  },

  investment_onboarding: {
    name: "Investment Customer Onboarding",
    description: "Sophisticated onboarding for investment platform customers",
    total_emails: 10,
    duration_days: 45,
    product_type: "investment",
    emails: [
      { day: 0, template_key: "payment_success_immediate" },
      { day: 1, template_key: "welcome_investment" },
      { day: 2, template_key: "kyc_reminder", trigger_conditions: ["kyc_incomplete"] },
      { day: 5, template_key: "investment_education_basics" },
      { day: 7, template_key: "onboarding_week_1", trigger_conditions: ["kyc_verified"] },
      { day: 14, template_key: "portfolio_setup_guide" },
      { day: 21, template_key: "market_insights_intro" },
      { day: 30, template_key: "month_one_performance" },
      { day: 35, template_key: "satisfaction_survey" },
      { day: 45, template_key: "advanced_features_unlock" }
    ]
  },

  customer_retention: {
    name: "At-Risk Customer Retention",
    description: "Re-engagement sequence for customers showing churn signals",
    total_emails: 6,
    duration_days: 21,
    product_type: "all",
    emails: [
      { day: 0, template_key: "we_miss_you" },
      { day: 3, template_key: "customer_at_risk_retention" },
      { day: 7, template_key: "feature_highlights" },
      { day: 10, template_key: "personal_advisor_intro" },
      { day: 14, template_key: "final_retention_offer" },
      { day: 21, template_key: "feedback_request", trigger_conditions: ["still_at_risk"] }
    ]
  }
};

/**
 * 📧 EMAIL SERVICE INTEGRATION
 */
export class FintechEmailService {
  private templateCache = new Map<string, EmailTemplate>();

  constructor() {
    // Cache templates for performance
    Object.entries(fintechEmailTemplates).forEach(([key, template]) => {
      this.templateCache.set(key, template);
    });
  }

  /**
   * Send email using template
   */
  async sendEmail(
    templateKey: string,
    recipient: { email: string; name: string },
    variables: Record<string, any>,
    organizationId: string
  ): Promise<boolean> {
    try {
      const template = this.templateCache.get(templateKey);
      if (!template) {
        throw new Error(`Template not found: ${templateKey}`);
      }

      // Replace variables in template
      const subject = this.replaceVariables(template.subject, variables);
      const html = this.replaceVariables(template.html, variables);
      const text = this.replaceVariables(template.text, variables);

      // In production, integrate with your email service (SendGrid, AWS SES, etc.)
      const emailData = {
        to: recipient.email,
        subject,
        html,
        text,
        from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
        template_key: templateKey,
        organization_id: organizationId
      };

      // Simulate email sending
      console.log(`📧 Sending email to ${recipient.email}: ${subject}`);

      return true;

    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  /**
   * Trigger email sequence
   */
  async triggerEmailSequence(
    sequenceKey: string,
    customer: { id: string; email: string; name: string; product_type: string },
    organizationId: string,
    customVariables: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const sequence = fintechEmailSequences[sequenceKey];
      if (!sequence) {
        throw new Error(`Email sequence not found: ${sequenceKey}`);
      }

      // Check if sequence applies to product type
      if (sequence.product_type !== 'all' && sequence.product_type !== customer.product_type) {
        console.log(`⏭️ Skipping sequence ${sequenceKey} - not applicable to ${customer.product_type}`);
        return false;
      }

      // Schedule all emails in sequence
      for (const email of sequence.emails) {
        await this.scheduleEmail(
          email.template_key,
          customer,
          organizationId,
          email.day,
          customVariables,
          email.trigger_conditions
        );
      }

      console.log(`✅ Triggered email sequence ${sequenceKey} for customer ${customer.id}`);
      return true;

    } catch (error) {
      console.error('❌ Error triggering email sequence:', error);
      return false;
    }
  }

  /**
   * Schedule individual email
   */
  private async scheduleEmail(
    templateKey: string,
    customer: { id: string; email: string; name: string },
    organizationId: string,
    delayDays: number,
    variables: Record<string, any>,
    triggerConditions?: string[]
  ): Promise<void> {
    try {
      // In production, use a job queue like Bull or integrate with n8n for scheduling
      // For now, we'll simulate scheduling

      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + delayDays);

      console.log(`📅 Scheduled ${templateKey} for ${customer.email} on ${scheduledDate.toDateString()}`);

      // Store in database for actual scheduling
      // await scheduleEmailInDatabase({
      //   customer_id: customer.id,
      //   organization_id: organizationId,
      //   template_key: templateKey,
      //   scheduled_for: scheduledDate,
      //   variables,
      //   trigger_conditions: triggerConditions
      // });

    } catch (error) {
      console.error('❌ Error scheduling email:', error);
    }
  }

  /**
   * Replace variables in template string
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    // Replace simple variables {{variable}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    // Handle array iterations {{#each array}}...{{/each}}
    result = this.handleArrayIterations(result, variables);

    return result;
  }

  /**
   * Handle Handlebars-style array iterations
   */
  private handleArrayIterations(template: string, variables: Record<string, any>): string {
    const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;

    return template.replace(eachRegex, (match, arrayName, innerTemplate) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';

      return array.map(item => {
        let itemTemplate = innerTemplate;

        // Replace {{this}} with item value
        itemTemplate = itemTemplate.replace(/{{this}}/g, String(item));

        // Replace {{this.property}} with item properties
        if (typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            const regex = new RegExp(`{{this\\.${key}}}`, 'g');
            itemTemplate = itemTemplate.replace(regex, String(value || ''));
          });
        }

        return itemTemplate;
      }).join('');
    });
  }

  /**
   * Get template by key
   */
  getTemplate(templateKey: string): EmailTemplate | undefined {
    return this.templateCache.get(templateKey);
  }

  /**
   * Get all templates by category
   */
  getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
    return Array.from(this.templateCache.values()).filter(
      template => template.category === category
    );
  }
}

export const fintechEmailService = new FintechEmailService();