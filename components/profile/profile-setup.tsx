"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { Brain, User, Target, BookOpen } from "lucide-react";

interface ProfileSetupProps {
  onComplete: (profile: any) => void;
}

const learningGoalOptions = [
  "Improve conversation skills",
  "Enhance vocabulary",
  "Master grammar rules",
  "Prepare for exams",
  "Professional communication",
  "Travel communication",
  "Academic writing",
  "Business English",
];

const topicOptions = [
  "Business & Work",
  "Travel & Tourism",
  "Technology",
  "Health & Medicine",
  "Education",
  "Entertainment",
  "Sports",
  "Food & Cooking",
  "Science",
  "Politics & Current Affairs",
];

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    proficiencyLevel: "",
    learningGoals: [] as string[],
    preferredTopics: [] as string[],
  });

  const supabase = createClient();

  const handleGoalChange = (goal: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        learningGoals: [...prev.learningGoals, goal],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        learningGoals: prev.learningGoals.filter((g) => g !== goal),
      }));
    }
  };

  const handleTopicChange = (topic: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        preferredTopics: [...prev.preferredTopics, topic],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        preferredTopics: prev.preferredTopics.filter((t) => t !== topic),
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const profileData = {
        id: user?.id,
        display_name: formData.displayName,
        proficiency_level: formData.proficiencyLevel,
        learning_goals: formData.learningGoals,
        preferred_topics: formData.preferredTopics,
        total_points: 0,
        current_level: 1,
      };

      const { data, error } = await supabase
        .from("user_profiles")
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;

      onComplete(data);
    } catch (error) {
      console.error("Error creating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#181818] to-[#1e1e1e] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border border-[#303030] bg-[#1a1a1a] text-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12 text-yellow-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Welcome to LinguaAI
          </CardTitle>
          <CardDescription className="text-gray-400">
            Let&apos;s set up your personalized learning experience
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= num
                      ? "bg-yellow-500 text-black"
                      : "bg-[#2a2a2a] text-gray-400"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > num ? "bg-yellow-500" : "bg-[#2a2a2a]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <User className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white">
                  Basic Information
                </h3>
                <p className="text-gray-400">Tell us about yourself</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Display Name
                </label>
                <Input
                  placeholder="How would you like to be called?"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  className="bg-[#121212] border border-[#303030] text-white placeholder-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  English Proficiency Level
                </label>
                <Select
                  value={formData.proficiencyLevel}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      proficiencyLevel: value,
                    }))
                  }
                >
                  <SelectTrigger className="bg-[#121212] border border-[#303030] text-white">
                    <SelectValue placeholder="Select your current level" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e1e] text-white border border-[#303030]">
                    <SelectItem value="beginner">
                      Beginner - Just starting out
                    </SelectItem>
                    <SelectItem value="intermediate">
                      Intermediate - Can hold basic conversations
                    </SelectItem>
                    <SelectItem value="advanced">
                      Advanced - Fluent with room for improvement
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Learning Goals */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white">
                  Learning Goals
                </h3>
                <p className="text-gray-400">What would you like to achieve?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {learningGoalOptions.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.learningGoals.includes(goal)}
                      onCheckedChange={(checked) =>
                        handleGoalChange(goal, checked as boolean)
                      }
                      className="border-[#303030] data-[state=checked]:bg-yellow-500"
                    />
                    <label
                      htmlFor={goal}
                      className="text-sm cursor-pointer text-gray-300"
                    >
                      {goal}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preferred Topics */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <BookOpen className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white">
                  Preferred Topics
                </h3>
                <p className="text-gray-400">
                  What subjects interest you most?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topicOptions.map((topic) => (
                  <div key={topic} className="flex items-center space-x-2">
                    <Checkbox
                      id={topic}
                      checked={formData.preferredTopics.includes(topic)}
                      onCheckedChange={(checked) =>
                        handleTopicChange(topic, checked as boolean)
                      }
                      className="border-[#303030] data-[state=checked]:bg-yellow-500"
                    />
                    <label
                      htmlFor={topic}
                      className="text-sm cursor-pointer text-gray-300"
                    >
                      {topic}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="border-[#303030] text-black hover:bg-[#2a2a2a] hover:text-white"
            >
              Previous
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 &&
                    (!formData.displayName || !formData.proficiencyLevel)) ||
                  (step === 2 && formData.learningGoals.length === 0)
                }
                className="bg-yellow-500  hover:bg-yellow-600  text-black font-semibold"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || formData.preferredTopics.length === 0}
                className="bg-yellow-500  hover:bg-yellow-600  text-black font-semibold"
              >
                {loading ? "Setting up..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
