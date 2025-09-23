import Link from "next/link";
import { MessageCircle, Mail, Shield, MessageSquare } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-[#303030]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-yellow-400" />
              <span className="text-lg font-bold text-white">linguaAi</span>
            </div>
            <p className="text-gray-400 text-sm">
              Master English with our AI-powered learning platform. Practice
              vocabulary, grammar, and conversation skills at your own pace.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Learning</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  Vocabulary Practice
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  Grammar Lessons
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  Conversation Practice
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  Progress Tracking
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-yellow-400" />
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/feedback"
                  className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4 text-yellow-400" />
                  Give Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2"
                >
                  <Shield className="h-4 w-4 text-yellow-400" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Features</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-400">✓ Personalized Learning</span>
              </li>
              <li>
                <span className="text-gray-400">✓ Instant Feedback</span>
              </li>
              <li>
                <span className="text-gray-400">✓ Progress Tracking</span>
              </li>
              <li>
                <span className="text-gray-400">
                  ✓ Interactive Conversations
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#303030] mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 linguaAi. All rights reserved. Built with care for English
            learners worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
