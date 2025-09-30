"use client";
import React, { useState, useEffect } from "react";
import { updateUserPreferences } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";

interface CategorySelectionProps {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

const youtube_categories = [
  // --- Core AI & ML Domains ---
  "machine_learning",
  "deep_learning",
  "supervised_learning",
  "unsupervised_learning",
  "reinforcement_learning",
  "neural_networks",
  "generative_ai",
  "foundation_models",
  "large_language_models",
  "small_language_models",
  "natural_language_processing",
  "computer_vision",
  "neuroai",

  // --- Applied AI Subdomains ---
  "ai_in_biology",
  "ai_in_healthcare",
  "ai_in_security",
  "ai_for_climate",
  "ai_in_art",
];



export default function CategorySelection({
  selectedCategories,
  setSelectedCategories,
}: CategorySelectionProps) {
  const [categories, setCategories] = useState(youtube_categories);
  const [newCategory, setNewCategory] = useState("");
  const { user } = useAuth();

  // Save preferences when categories change
  useEffect(() => {
    const savePreferences = async () => {
      if (user && selectedCategories.length > 0) {
        const preferences = {
          topic: selectedCategories.join(", ")
        };
        
        const result = await updateUserPreferences(user.id, preferences);
        if (result.error) {
          console.error("Error saving preferences:", result.error);
        } else {
          console.log("Preferences saved successfully");
        }
      }
    };

    // Debounce the save operation to avoid too many API calls
    const timeoutId = setTimeout(savePreferences, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedCategories, user]);
  return (
    <div className=" w-full h-full flex flex-col gap-8 items-center">
      <div className="text-center space-y-4">
        <h1 className=" text-3xl font-bold">Pick Your Interests!</h1>
        
        {/* Guidelines Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">📋 How to Select Your Preferences</h2>
          <div className="text-blue-700 text-sm space-y-2">
            <p>• <strong>Click on categories</strong> that interest you - they'll turn green when selected</p>
            <p>• <strong>Select multiple topics</strong> to get diverse recommendations</p>
            <p>• <strong>Add custom categories</strong> using the input field below</p>
            <p>• <strong>Your preferences are saved automatically</strong> for better recommendations</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        {selectedCategories.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-md mx-auto">
            <p className="text-green-800 font-medium">
              ✅ {selectedCategories.length} categories selected
            </p>
            <p className="text-green-600 text-sm">Great! You'll get personalized recommendations</p>
          </div>
        )}
      </div>
      
      <div className=" flex flex-wrap justify-center gap-4 max-w-[500px] mx-auto overflow-scroll">
        {categories.map((category) => (
          <div
            className={`px-4 py-1 rounded-full  cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-105 font-semibold ${
              selectedCategories.includes(category)
                ? "bg-green-400 hover:bg-green-300"
                : "bg-zinc-100 hover:bg-zinc-50"
            }`}
            key={category}
            onClick={() => {
              if (selectedCategories.includes(category)) {
                setSelectedCategories(
                  selectedCategories.filter((c) => c !== category)
                );
              } else {
                setSelectedCategories([...selectedCategories, category]);
              }
            }}
          >
            {category}
          </div>
        ))}
      </div>
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 font-medium">Don't see your topic? Add it below:</p>
        <div className=" border-b-1 border-zinc pb-2 max-w-[200px] mx-auto">
          <input
            type="text"
            placeholder="Type & press Enter"
            className=" text-center rounded-full font-semibold focus:outline-none focus:ring-0 focus:border-transparent w-full"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCategory.trim()) {
                const trimmedCategory = newCategory.trim();
                if (!categories.includes(trimmedCategory)) {
                  setCategories([...categories, trimmedCategory]);
                  setSelectedCategories([...selectedCategories, trimmedCategory]);
                }
                setNewCategory("");
              }
            }}
          />
        </div>
        <p className="text-xs text-gray-500">💡 Custom categories help improve your recommendations</p>
      </div>
    </div>
  );
}
