import Link from "next/link"
import { MessageCircle, Mail, Shield, MessageSquare } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">linguaAi</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Master English with our AI-powered learning platform. Practice vocabulary, grammar, and conversation
              skills at your own pace.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Learning</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Vocabulary Practice
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Grammar Lessons
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Conversation Practice
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Progress Tracking
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/feedback"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Give Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Features</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground">✓ Personalized Learning</span>
              </li>
              <li>
                <span className="text-muted-foreground">✓ Instant Feedback</span>
              </li>
              <li>
                <span className="text-muted-foreground">✓ Progress Tracking</span>
              </li>
              <li>
                <span className="text-muted-foreground">✓ Interactive Conversations</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 linguaAi. All rights reserved. Built with care for English learners worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}
