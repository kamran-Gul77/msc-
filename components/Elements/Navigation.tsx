"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[#121212]/95 backdrop-blur supports-[backdrop-filter]:bg-[#121212]/60 sticky top-0 z-50 w-full border-b border-[#303030]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <MessageCircle className="h-8 w-8 text-yellow-400" />
            <span className="text-xl font-bold text-white">linguaAi</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/privacy"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/feedback"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              Feedback
            </Link>
            <Link
              href="/login"
              className="text-white hover:text-yellow-400 transition-colors font-semibold"
            >
              Start Learning Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#1c1c1c] rounded-lg mt-2">
              <Link
                href="/"
                className="block px-3 py-2 text-white hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/privacy"
                className="block px-3 py-2 text-white hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Privacy Policy
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-white hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/feedback"
                className="block px-3 py-2 text-white hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Feedback
              </Link>
              <div className="px-3 py-2">
                <Link
                  href="/login"
                  className="block text-white hover:text-yellow-400 transition-colors font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Start Learning Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
