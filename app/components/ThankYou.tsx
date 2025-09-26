"use client";
import React from "react";
import { useAuth } from "@/lib/AuthProvider";
import Image from "next/image";

interface ThankYouProps {
  uniId: string;
  setUniId: (uniId: string) => void;
}

export default function ThankYou({ uniId, setUniId }: ThankYouProps) {
  const { user } = useAuth();
  
  return (
    <div className=" w-full h-full flex flex-col gap-12 items-center">
      <h2 className="text-3xl font-bold mb-6 text-center sticky top-0 bg-white z-10 font-playfair">
        Thank you for your feedback!
      </h2>
      <div className="text-center py-8 relative w-full h-[60%]">
        <Image
          src="/thankyou.gif"
          alt="Loading"
          fill
          className="object-contain"
          unoptimized
        />
      </div>
      <div className="border-b-1 border-zinc pb-2 max-w-[200px]">
        <input
          type="text"
          placeholder="Your email here.."
          className="text-center rounded-full font-semibold focus:outline-none focus:ring-0 focus:border-transparent"
          value={user?.email || uniId}
          onChange={(e) => !user?.email && setUniId(e.target.value)}
          disabled={!!user?.email}
        />
      </div>
    </div>
  );
}
