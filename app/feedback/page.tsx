"use client";

import type React from "react";
import { useState, useEffect } from "react";

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
import { Navigation } from "@/components/Elements/Navigation";
import { Footer } from "@/components/Elements/Footer";
import FeedbackCarousel from "@/components/Feedback/FeedbackCarousel";

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    experience: "",
    suggestion: "",
    recommend: "",
  });

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Submit feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData, rating };
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Thank you for your feedback!");
        setFormData({
          name: "",
          email: "",
          category: "",
          experience: "",
          suggestion: "",
          recommend: "",
        });
        setRating(0);
        fetchFeedbacks(); // refresh carousel
      } else {
        alert("❌ Failed to submit feedback: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // Fetch feedbacks for carousel
  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setFeedbacks(data);
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Star Rating Component
  const StarRating = ({
    rating,
    setRating,
  }: {
    rating: number;
    setRating: (rating: number) => void;
  }) => (
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
          <Star className={`h-6 w-6 ${star <= rating ? "fill-current" : ""}`} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#181818]">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <MessageSquare className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Share Your Feedback
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Your experience matters to us. Help us improve linguaAi by sharing
              your thoughts and suggestions.
            </p>
          </div>

          {/* Stats + Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats */}
            <div className="space-y-6">
              <Card className="bg-[#212121] border border-[#303030] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-yellow-400" />
                    Community Impact
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    See how your feedback contributes to our community
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">
                        Active Learners
                      </span>
                    </div>
                    <Badge variant="secondary">12,847</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">
                        Average Rating
                      </span>
                    </div>
                    <Badge variant="secondary">4.8/5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">
                        Satisfaction Rate
                      </span>
                    </div>
                    <Badge variant="secondary">96%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">
                        Features Added
                      </span>
                    </div>
                    <Badge variant="secondary">47</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="bg-[#212121] border border-[#303030] text-white">
                <CardHeader>
                  <CardTitle className="text-white">
                    Tell Us About Your Experience
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Your feedback helps us create a better learning experience
                    for everyone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-white">
                          Name (Optional)
                        </Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">
                          Email (Optional)
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                        />
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                      <Label className="text-white">Overall Rating *</Label>
                      <div className="flex items-center gap-4">
                        <StarRating rating={rating} setRating={setRating} />
                        <span className="text-sm text-gray-400">
                          {rating === 0 && "Please rate your experience"}
                          {rating === 1 && "Poor"}
                          {rating === 2 && "Fair"}
                          {rating === 3 && "Good"}
                          {rating === 4 && "Very Good"}
                          {rating === 5 && "Excellent"}
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white">
                        Feedback Category
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("category", value)
                        }
                      >
                        <SelectTrigger className="bg-[#181818] border border-[#303030] text-white">
                          <SelectValue placeholder="What aspect would you like to comment on?" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#212121] text-white">
                          {[
                            "Overall Experience",
                            "Vocabulary Learning",
                            "Grammar Practice",
                            "Conversation Practice",
                            "User Interface",
                            "Performance & Speed",
                            "Mobile Experience",
                            "Progress Tracking",
                          ].map((item, idx) => (
                            <SelectItem
                              key={idx}
                              value={item.toLowerCase().replace(/ /g, "-")}
                              className="text-white"
                            >
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Experience */}
                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-white">
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
                        className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                      />
                    </div>

                    {/* Suggestion */}
                    <div className="space-y-2">
                      <Label htmlFor="suggestion" className="text-white">
                        How can we improve?
                      </Label>
                      <Textarea
                        id="suggestion"
                        placeholder="Share your suggestions..."
                        rows={4}
                        value={formData.suggestion}
                        onChange={(e) =>
                          handleInputChange("suggestion", e.target.value)
                        }
                        className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                      />
                    </div>

                    {/* Recommend */}
                    <div className="space-y-2">
                      <Label htmlFor="recommend" className="text-white">
                        Would you recommend linguaAi?
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("recommend", value)
                        }
                      >
                        <SelectTrigger className="bg-[#181818] border border-[#303030] text-white">
                          <SelectValue placeholder="Select your recommendation level" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#212121] text-white">
                          {[
                            "Definitely - I love it!",
                            "Probably - It is quite good",
                            "Maybe - It has potential",
                            "Probably not - Needs improvement",
                            "Definitely not - Major issues",
                          ].map((item, idx) => (
                            <SelectItem
                              key={idx}
                              value={item.toLowerCase().replace(/ /g, "-")}
                              className="text-white"
                            >
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-[#303030] hover:bg-[#212121] text-white border border-[#181818]"
                      disabled={rating === 0 || loading}
                    >
                      {loading ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feedback Carousel */}
          <div className="mt-16">
            <div className="flex gap-6 overflow-x-auto pb-4">
              <FeedbackCarousel />
              {feedbacks.length === 0 && (
                <p className="text-gray-400 text-center w-full">
                  No feedback yet. Be the first!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
