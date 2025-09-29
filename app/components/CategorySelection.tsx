"use client";
import React, { useState, useEffect } from "react";
import { updateUserPreferences } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";

interface CategorySelectionProps {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

const youtube_categories = [
  // --- Applied AI Subdomains ---
  "ai_in_healthcare",
  "ai_in_finance_and_banking",
  "ai_in_education_and_learning",
  "ai_in_agriculture_and_farming",
  "ai_in_manufacturing_and_industry",
  "ai_in_transportation_and_logistics",
  "ai_in_autonomous_vehicles",
  "ai_in_robotics_and_automation",
  "ai_in_smart_cities_and_iot",
  "ai_in_energy_and_environment",
  "ai_in_climate_and_sustainability",
  "ai_in_cybersecurity",
  "ai_in_retail_and_ecommerce",
  "ai_in_media_and_entertainment",
  "ai_in_gaming_and_simulation",
  "ai_in_law_and_governance",
  "ai_in_defense_and_security",
  "ai_in_human_resources_and_recruitment",
  "ai_in_social_good_and_nonprofits",
  "ai_in_space_and_astronomy",
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
