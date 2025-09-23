"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, MessageCircle, Clock, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { Navigation } from "@/components/Elements/Navigation";
import { Footer } from "@/components/Elements/Footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    // You would typically send this to your backend
    alert("Thank you for your message! We'll get back to you within 24 hours.");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#181818]">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Mail className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Have questions about linguaAi? We are here to help you on your
              learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="bg-[#212121] border border-[#303030] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MessageCircle className="h-5 w-5 text-yellow-400" />
                    Get in Touch
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    We would love to hear from you. Send us a message and we
                    will respond as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">Email</p>
                      <p className="text-sm text-gray-400">
                        support@linguaAi.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">Phone</p>
                      <p className="text-sm text-gray-400">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">Response Time</p>
                      <p className="text-sm text-gray-400">Within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">Office</p>
                      <p className="text-sm text-gray-400">
                        123 Learning Street
                        <br />
                        Education City, EC 12345
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#212121] border border-[#303030] text-white">
                <CardHeader>
                  <CardTitle className="text-white">
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-white mb-1">
                      How does the AI chatbot work?
                    </h4>
                    <p className="text-sm text-gray-400">
                      Our AI analyzes your responses and adapts lessons to your
                      skill level, providing personalized feedback and
                      recommendations.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">
                      Is my data secure?
                    </h4>
                    <p className="text-sm text-gray-400">
                      Yes, we use industry-standard encryption and security
                      measures to protect your personal information and learning
                      data.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">
                      Can I track my progress?
                    </h4>
                    <p className="text-sm text-gray-400">
                      Our platform provides detailed analytics on your learning
                      progress, strengths, and areas for improvement.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="bg-[#212121] border border-[#303030] text-white">
                <CardHeader>
                  <CardTitle className="text-white">
                    Send us a Message
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Fill out the form below and we will get back to you as soon
                    as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-white">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          required
                          className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          required
                          className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white">
                        Category
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("category", value)
                        }
                      >
                        <SelectTrigger className="bg-[#181818] border border-[#303030] text-white">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#212121] text-white">
                          <SelectItem value="general" className="text-white">
                            General Inquiry
                          </SelectItem>
                          <SelectItem value="technical" className="text-white">
                            Technical Support
                          </SelectItem>
                          <SelectItem value="billing" className="text-white">
                            Billing Question
                          </SelectItem>
                          <SelectItem value="feature" className="text-white">
                            Feature Request
                          </SelectItem>
                          <SelectItem value="bug" className="text-white">
                            Bug Report
                          </SelectItem>
                          <SelectItem
                            value="partnership"
                            className="text-white"
                          >
                            Partnership
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-white">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your inquiry"
                        value={formData.subject}
                        onChange={(e) =>
                          handleInputChange("subject", e.target.value)
                        }
                        required
                        className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-white">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Please provide details about your inquiry..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) =>
                          handleInputChange("message", e.target.value)
                        }
                        required
                        className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                      />
                    </div>

                    <div className="bg-[#181818] rounded-lg p-4 border border-[#303030]">
                      <p className="text-sm text-gray-400">
                        <strong>Note:</strong> For technical issues, please
                        include details about your device, browser, and any
                        error messages you encountered. This helps us provide
                        better support.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-[#303030] hover:bg-[#212121] text-white border border-[#181818]"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
