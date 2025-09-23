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
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { useState } from "react";
import { Navigation } from "@/components/Elements/Navigation";
import { Footer } from "@/components/Elements/Footer";

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    experience: "",
    suggestion: "",
    recommend: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Feedback submitted:", { ...formData, rating });
    alert("Thank you for your feedback! Your input helps us improve linguaAi.");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const StarRating = ({
    rating,
    setRating,
  }: {
    rating: number;
    setRating: (rating: number) => void;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl transition-colors ${
              star <= rating
                ? "text-yellow-400"
                : "text-gray-300 hover:text-yellow-200"
            }`}
          >
            <Star
              className={`h-6 w-6 ${star <= rating ? "fill-current" : ""}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <MessageSquare className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Share Your Feedback
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your experience matters to us. Help us improve linguaAi by sharing
              your thoughts and suggestions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feedback Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Community Impact
                  </CardTitle>
                  <CardDescription>
                    See how your feedback contributes to our community
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Active Learners
                      </span>
                    </div>
                    <Badge variant="secondary">12,847</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium">
                        Average Rating
                      </span>
                    </div>
                    <Badge variant="secondary">4.8/5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Satisfaction Rate
                      </span>
                    </div>
                    <Badge variant="secondary">96%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Features Added
                      </span>
                    </div>
                    <Badge variant="secondary">47</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Improvements</CardTitle>
                  <CardDescription>
                    Features added based on user feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Enhanced Grammar Explanations
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added detailed rule explanations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Progress Analytics
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Visual learning progress tracking
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Mobile Optimization
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Better mobile learning experience
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Conversation Scenarios
                      </p>
                      <p className="text-xs text-muted-foreground">
                        More real-world practice situations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tell Us About Your Experience</CardTitle>
                  <CardDescription>
                    Your feedback helps us create a better learning experience
                    for everyone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name (Optional)</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Overall Rating *</Label>
                      <div className="flex items-center gap-4">
                        <StarRating rating={rating} setRating={setRating} />
                        <span className="text-sm text-muted-foreground">
                          {rating === 0 && "Please rate your experience"}
                          {rating === 1 && "Poor"}
                          {rating === 2 && "Fair"}
                          {rating === 3 && "Good"}
                          {rating === 4 && "Very Good"}
                          {rating === 5 && "Excellent"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Feedback Category</Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("category", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="What aspect would you like to comment on?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="overall">
                            Overall Experience
                          </SelectItem>
                          <SelectItem value="vocabulary">
                            Vocabulary Learning
                          </SelectItem>
                          <SelectItem value="grammar">
                            Grammar Practice
                          </SelectItem>
                          <SelectItem value="conversation">
                            Conversation Practice
                          </SelectItem>
                          <SelectItem value="ui">User Interface</SelectItem>
                          <SelectItem value="performance">
                            Performance & Speed
                          </SelectItem>
                          <SelectItem value="mobile">
                            Mobile Experience
                          </SelectItem>
                          <SelectItem value="progress">
                            Progress Tracking
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">
                        What did you like most? *
                      </Label>
                      <Textarea
                        id="experience"
                        placeholder="Tell us about your positive experiences with linguaAi..."
                        rows={4}
                        value={formData.experience}
                        onChange={(e) =>
                          handleInputChange("experience", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="suggestion">How can we improve?</Label>
                      <Textarea
                        id="suggestion"
                        placeholder="Share your suggestions for making linguaAi even better..."
                        rows={4}
                        value={formData.suggestion}
                        onChange={(e) =>
                          handleInputChange("suggestion", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recommend">
                        Would you recommend linguaAi?
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("recommend", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your recommendation level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="definitely">
                            Definitely - I love it!
                          </SelectItem>
                          <SelectItem value="probably">
                            Probably - It is quite good
                          </SelectItem>
                          <SelectItem value="maybe">
                            Maybe - It has potential
                          </SelectItem>
                          <SelectItem value="probably-not">
                            Probably not - Needs improvement
                          </SelectItem>
                          <SelectItem value="definitely-not">
                            Definitely not - Major issues
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Privacy Note:</strong> Your feedback may be used
                        to improve our service. Personal information will be
                        kept confidential and used only for follow-up if you
                        provide contact details.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={rating === 0}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Submit Feedback
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
