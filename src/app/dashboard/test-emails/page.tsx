'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormError from '@/components/ui/FormError';
import Badge from '@/components/ui/Badge';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type EmailTemplate = 'invitation' | 'welcome' | 'password_reset' | 'defect_alert';

interface EmailTemplateInfo {
  id: EmailTemplate;
  name: string;
  description: string;
  status: 'implemented' | 'planned';
  variables: string[];
}

const EMAIL_TEMPLATES: EmailTemplateInfo[] = [
  {
    id: 'invitation',
    name: 'User Invitation',
    description: 'Sent when a new user is invited to join the organisation',
    status: 'implemented',
    variables: ['userName', 'role', 'invitedBy', 'invitationUrl'],
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Sent when a new organisation is created',
    status: 'implemented',
    variables: ['userName', 'organisationName'],
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    description: 'Sent when user requests password reset',
    status: 'implemented',
    variables: ['userName', 'resetUrl'],
  },
  {
    id: 'defect_alert',
    name: 'Critical Defect Alert',
    description: 'Sent when a critical defect is raised',
    status: 'implemented',
    variables: ['userName', 'defectTitle', 'siteName', 'severity'],
  },
];

export default function TestEmailsPage() {
  const { user, userData } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>('invitation');
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [testName, setTestName] = useState(userData?.name || 'Test User');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentTemplate = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate);

  const handleSendTest = async () => {
    setError('');
    setSuccess('');

    if (!testEmail || !testName) {
      setError('Please enter both email and name');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          name: testName,
          template: selectedTemplate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setSuccess(`Test email sent successfully to ${testEmail}! Check your inbox.`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error sending test email:', err);
      setError(err.message || 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Email Templates Testing</h1>
        <p className="text-sm text-brand-600 mt-1">
          Test and preview email templates before sending to users
        </p>
      </div>

      {/* Warning Notice */}
      <Card className="border-l-4 border-l-orange-500 bg-orange-50">
        <Card.Content>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-700 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900">Development Testing Only</h3>
              <p className="text-sm text-orange-800 mt-1">
                This page is for testing email templates during development. In production, remove this page or restrict access to administrators only.
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Templates
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-2">
                {EMAIL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    disabled={template.status === 'planned'}
                    className={`w-full text-left p-3 border-2 rounded-lg transition-all ${
                      selectedTemplate === template.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-brand-200 hover:border-brand-300 bg-white'
                    } ${template.status === 'planned' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-brand-900 text-sm">
                        {template.name}
                      </span>
                      <Badge
                        variant={template.status === 'implemented' ? 'pass' : 'pending'}
                        className="text-xs"
                      >
                        {template.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-brand-600 line-clamp-2">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Template Details & Testing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Info */}
          <Card>
            <Card.Header>Template Details</Card.Header>
            <Card.Content>
              {currentTemplate ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-900 mb-1">
                      {currentTemplate.name}
                    </h3>
                    <p className="text-sm text-brand-600">
                      {currentTemplate.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-brand-900 mb-2">
                      Template Variables:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentTemplate.variables.map((variable) => (
                        <code
                          key={variable}
                          className="px-2 py-1 bg-brand-100 text-brand-900 text-xs rounded font-mono"
                        >
                          {variable}
                        </code>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <p className="text-sm text-brand-600">Select a template to view details</p>
              )}
            </Card.Content>
          </Card>

          {/* Test Email Form */}
          {currentTemplate && (
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Test Email
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {error && <FormError message={error} />}

                  {success && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded">
                      <CheckCircle2 className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">Success!</p>
                        <p className="text-sm text-green-800 mt-1">{success}</p>
                      </div>
                    </div>
                  )}

                  <Input
                    label="Your Email Address"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    required
                    disabled={sending}
                    helperText="The test email will be sent to this address"
                  />

                  <Input
                    label="Your Name"
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="John Smith"
                    required
                    disabled={sending}
                    helperText="Used to personalize the email content"
                  />

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                    <div className="flex items-start gap-2">
                      <Mail className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Email Preview
                        </p>
                        <div className="text-xs text-blue-800 space-y-1">
                          <p><strong>To:</strong> {testEmail || 'your-email@example.com'}</p>
                          <p><strong>From:</strong> Fire Safety &lt;onboarding@resend.dev&gt;</p>
                          <p><strong>Subject:</strong> {
                            selectedTemplate === 'invitation' ? 'Test Invitation - Fire Safety Log Book' :
                            selectedTemplate === 'welcome' ? 'Welcome to Fire Safety Log Book' :
                            selectedTemplate === 'password_reset' ? 'Reset Your Password - Fire Safety Log Book' :
                            selectedTemplate === 'defect_alert' ? 'Critical Defect Alert - Fire Safety Log Book' :
                            'Fire Safety Log Book'
                          }</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleSendTest}
                    disabled={sending || !testEmail || !testName}
                    isLoading={sending}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Test Email...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Test Email
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-brand-600 space-y-1">
                    <p><strong>Note:</strong> The test email will include a warning banner indicating it's a test.</p>
                    <p>Check your spam/junk folder if you don't receive it within a few minutes.</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Email Template Preview */}
          {currentTemplate && (
            <Card>
              <Card.Header>HTML Preview</Card.Header>
              <Card.Content>
                <div className="bg-brand-50 border border-brand-200 rounded p-4">
                  <p className="text-sm text-brand-600 mb-3">
                    Professional HTML email with:
                  </p>
                  <ul className="text-sm text-brand-700 space-y-1 list-disc list-inside">
                    <li>Black and white branded header</li>
                    <li>Clear call-to-action button</li>
                    <li>Personalized greeting and content</li>
                    {currentTemplate.id === 'invitation' && <li>Role and invitation details</li>}
                    {currentTemplate.id === 'welcome' && <li>Quick start guide with checklist</li>}
                    {currentTemplate.id === 'password_reset' && <li>Security warning with 1-hour expiration</li>}
                    {currentTemplate.id === 'defect_alert' && <li>Defect details table with severity badge</li>}
                    <li>Backup text link for compatibility</li>
                    <li>Test warning banner (removed in production)</li>
                    <li>Professional footer with branding</li>
                    <li>Mobile-responsive design</li>
                  </ul>
                </div>
              </Card.Content>
            </Card>
          )}
        </div>
      </div>

      {/* Resend Configuration */}
      <Card>
        <Card.Header>Email Service Configuration</Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-brand-900 mb-1">Service Provider</div>
              <div className="flex items-center gap-2">
                <Badge variant="pass">Resend</Badge>
                <span className="text-sm text-brand-600">API Configured</span>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-brand-900 mb-1">From Address</div>
              <code className="text-sm text-brand-600 bg-brand-50 px-2 py-1 rounded">
                Fire Safety &lt;onboarding@resend.dev&gt;
              </code>
            </div>

            <div>
              <div className="text-sm font-medium text-brand-900 mb-1">Environment</div>
              <Badge variant="pending">
                {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
              </Badge>
            </div>

            <div>
              <div className="text-sm font-medium text-brand-900 mb-1">Base URL</div>
              <code className="text-sm text-brand-600 bg-brand-50 px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
              </code>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
