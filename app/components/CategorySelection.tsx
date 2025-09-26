"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { updateUserPreferences } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";

interface CategorySelectionProps {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

const youtube_categories = [
  "machine_learning",
  "deep_learning",
  "supervised_learning",
  "unsupervised_learning",
  "semi_supervised_learning",
  "self_supervised_learning",
  "reinforcement_learning",
  "multi_agent_systems",
  "natural_language_processing",
  "information_retrieval",
  "speech_recognition",
  "text_to_speech",
  "computer_vision",
  "image_processing",
  "video_understanding",
  "generative_models",
  "diffusion_models",
  "gans",
  "transformers",
  "graph_machine_learning",
  "knowledge_graphs",
  "recommendation_systems",
  "time_series_forecasting",
  "anomaly_detection",
  "causal_inference",
  "bayesian_machine_learning",
  "meta_learning",
  "continual_learning",
  "transfer_learning",
  "few_shot_learning",
  "explainable_ai",
  "fairness_bias_ethics",
  "privacy_preserving_ml",
  "federated_learning",
  "neuro_symbolic_ai",
  "evolutionary_computation",
  "optimization_for_ml",
  "robotics",
  "planning_and_reasoning",
  "autonomous_driving",
  "mlops",
  "automl",
  "edge_ai",
  "embedded_ai",
  "aigc_content_generation",
  "prompt_engineering",
  "agentic_workflows",
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
    <div className=" w-full h-full flex flex-col gap-12 items-center">
      <h1 className=" text-3xl font-bold">Pick Some!</h1>
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
              {
                if (selectedCategories.includes(category)) {
                  setSelectedCategories(
                    selectedCategories.filter((c) => c !== category)
                  );
                } else {
                  setSelectedCategories([...selectedCategories, category]);
                }
              }
            }}
          >
            {category}
          </div>
        ))}
      </div>
      <div className=" border-b-1 border-zinc pb-2 max-w-[200px]">
        <input
          type="text"
          placeholder="Add your own.."
          className=" text-center rounded-full font-semibold focus:outline-none focus:ring-0 focus:border-transparent"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setCategories([...categories, newCategory]);
              setSelectedCategories([...selectedCategories, newCategory]);
              setNewCategory("");
            }
          }}
        />
      </div>
    </div>
  );
}
