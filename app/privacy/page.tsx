import { Footer } from "@/components/Elements/Footer";
import { Navigation } from "@/components/Elements/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Lock, Eye, UserCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#121212]">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-400">
              Your privacy and data security are our top priorities
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: December 2024
            </p>
          </div>

          <div className="space-y-8">
            <Card className="bg-[#1E1E1E] border border-[#303030]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <UserCheck className="h-5 w-5 text-yellow-400" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Account Information
                  </h3>
                  <p>
                    We collect basic account information such as your email
                    address, username, and learning preferences to provide
                    personalized learning experiences.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Learning Data
                  </h3>
                  <p>
                    We track your learning progress, quiz results, and
                    conversation history to improve our AI recommendations and
                    track your improvement over time.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Usage Analytics
                  </h3>
                  <p>
                    We collect anonymous usage data to understand how our
                    platform is used and to improve the learning experience for
                    all users.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border border-[#303030]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5 text-yellow-400" />
                  How We Protect Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">Encryption</h3>
                  <p>
                    All data is encrypted in transit and at rest using
                    industry-standard encryption protocols.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Access Controls
                  </h3>
                  <p>
                    We implement strict access controls to ensure only
                    authorized personnel can access user data, and only when
                    necessary for platform operations.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Regular Security Audits
                  </h3>
                  <p>
                    Our systems undergo regular security audits and penetration
                    testing to identify and address potential vulnerabilities.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border border-[#303030]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Eye className="h-5 w-5 text-yellow-400" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>
                      Provide personalized learning recommendations and adapt
                      content to your skill level
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>
                      Track your learning progress and provide detailed
                      analytics on your improvement
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>
                      Improve our AI algorithms and learning content based on
                      aggregated user data
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>
                      Send you important updates about your account and new
                      features (you can opt out anytime)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>
                      Provide customer support and respond to your inquiries
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-[#2A1A1A] border border-red-600/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Prohibited Content and Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <p className="font-medium text-white">
                  To maintain a safe and educational environment, the following
                  content and activities are strictly prohibited:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Prohibited Content:
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-400">
                      <li>• Illegal activities or content</li>
                      <li>• Hate speech or discriminatory language</li>
                      <li>• Adult or inappropriate content</li>
                      <li>• Violence or threats</li>
                      <li>• Spam or promotional content</li>
                      <li>• Personal information sharing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Prohibited Activities:
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-400">
                      <li>• Attempting to hack or exploit the system</li>
                      <li>• Creating multiple fake accounts</li>
                      <li>• Sharing account credentials</li>
                      <li>• Using automated tools or bots</li>
                      <li>• Reverse engineering our AI models</li>
                      <li>• Commercial use without permission</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-[#1E1E1E] rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-400">
                    <strong>Note:</strong> Our AI chatbot is designed for
                    educational purposes only. Any attempts to use it for
                    illegal activities, generate harmful content, or bypass
                    safety measures will result in immediate account suspension
                    and may be reported to relevant authorities.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border border-[#303030]">
              <CardHeader>
                <CardTitle className="text-white">
                  Your Rights and Choices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Data Access and Portability
                  </h3>
                  <p>
                    You can request a copy of all your personal data and
                    learning history at any time through your account settings.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Data Deletion
                  </h3>
                  <p>
                    You can delete your account and all associated data at any
                    time. Some anonymized learning data may be retained for
                    research purposes.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Communication Preferences
                  </h3>
                  <p>
                    You can control what types of emails you receive from us and
                    opt out of non-essential communications.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border border-[#303030]">
              <CardHeader>
                <CardTitle className="text-white">Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <p className="mb-4">
                  If you have any questions about this Privacy Policy or how we
                  handle your data, please contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong> privacy@linguaAi.com
                  </p>
                  <p>
                    <strong>Address:</strong> linguaAi Privacy Team, 123
                    Learning Street, Education City, EC 12345
                  </p>
                  <p>
                    <strong>Response Time:</strong> We aim to respond to all
                    privacy inquiries within 48 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
