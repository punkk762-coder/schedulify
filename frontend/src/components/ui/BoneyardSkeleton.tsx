"use client";

import React from "react";
import { Skeleton } from "boneyard-js/react";

/**
 * Basic Bone Primitive with warm organic craft theme
 */
export function Bone({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`bg-gradient-to-r from-[#f3e8de] via-[#faefe6] to-[#f3e8de] animate-pulse rounded-xl ${className}`}
    />
  );
}

/**
 * Full Cockpit Skeleton for Today's OS View
 */
export function TodaySkeleton() {
  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in duration-300">
      {/* ─── Top Executive Hero Header Skeleton ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dfc0b7] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bone className="w-3 h-3 rounded-full" />
              <Bone className="w-32 h-4 rounded-full" />
              <Bone className="w-24 h-4 rounded-full" />
            </div>
            <Bone className="w-64 sm:w-80 h-9 rounded-2xl" />
            <Bone className="w-48 sm:w-60 h-4 rounded-full" />
          </div>

          <div className="flex items-center gap-3">
            <Bone className="w-28 h-12 rounded-2xl" />
            <Bone className="w-32 h-12 rounded-2xl" />
          </div>
        </div>

        {/* Quick Log Input Skeleton */}
        <div className="pt-2">
          <Bone className="w-full h-12 rounded-2xl" />
        </div>
      </div>

      {/* ─── Macro & Metric Cards Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 border border-[#dfc0b7] shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Bone className="w-20 h-4 rounded-full" />
              <Bone className="w-6 h-6 rounded-lg" />
            </div>
            <Bone className="w-28 h-7 rounded-xl" />
            <Bone className="w-full h-2 rounded-full" />
          </div>
        ))}
      </div>

      {/* ─── Two-Column Cockpit Skeleton (Timeline & Recovery) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Timeline Items */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
            <Bone className="w-36 h-5 rounded-full" />
            <Bone className="w-28 h-7 rounded-full" />
          </div>

          {/* Next Up Card Skeleton */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#dfc0b7] shadow-xs space-y-4">
            <div className="flex items-start gap-4">
              <Bone className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="w-24 h-4 rounded-full" />
                <Bone className="w-48 h-6 rounded-xl" />
                <Bone className="w-36 h-3 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-[#dfc0b7]/60">
              <Bone className="w-28 h-9 rounded-full" />
              <Bone className="w-24 h-9 rounded-full" />
            </div>
          </div>

          {/* Subsequent Occurrences Skeleton */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#dfc0b7] shadow-xs flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 flex-1">
                <Bone className="w-10 h-10 rounded-2xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Bone className="w-14 h-3.5 rounded-full" />
                    <Bone className="w-16 h-3.5 rounded-full" />
                  </div>
                  <Bone className="w-44 h-5 rounded-xl" />
                </div>
              </div>
              <Bone className="w-20 h-8 rounded-full shrink-0" />
            </div>
          ))}
        </div>

        {/* Right Column: Fitness Cockpit Skeleton */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dfc0b7] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
              <div className="space-y-1">
                <Bone className="w-36 h-5 rounded-full" />
                <Bone className="w-28 h-3.5 rounded-full" />
              </div>
              <Bone className="w-20 h-6 rounded-full" />
            </div>

            {/* Sliders Skeleton */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2 p-3 rounded-2xl bg-[#fcf2e6]/60 border border-[#dfc0b7]/60">
                <div className="flex items-center justify-between">
                  <Bone className="w-24 h-4 rounded-full" />
                  <Bone className="w-16 h-4 rounded-full" />
                </div>
                <Bone className="w-full h-4 rounded-full" />
              </div>
            ))}

            <Bone className="w-full h-11 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Mom's Meal Preparation Deck
 */
export function MomDeckSkeleton() {
  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#dfc0b7] shadow-xs flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="w-36 h-4 rounded-full" />
          <Bone className="w-56 h-7 rounded-xl" />
          <Bone className="w-40 h-3 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Bone className="w-24 h-9 rounded-xl" />
        </div>
      </div>

      {/* Calendar Skeleton */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#dfc0b7] space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]/50">
          <Bone className="w-32 h-4 rounded-full" />
          <Bone className="w-20 h-7 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-[#dfc0b7]/40">
              <div className="flex items-center gap-2">
                <Bone className="w-10 h-10 rounded-lg" />
                <div className="space-y-1">
                  <Bone className="w-24 h-3.5 rounded-full" />
                  <Bone className="w-16 h-2.5 rounded-full" />
                </div>
              </div>
              <Bone className="w-14 h-6 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Meal Cards Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]/60">
              <div className="flex items-center gap-2">
                <Bone className="w-14 h-4 rounded-full" />
                <Bone className="w-20 h-4 rounded-full" />
              </div>
              <Bone className="w-28 h-7 rounded-xl" />
            </div>

            <Bone className="w-56 h-6 rounded-xl" />

            {/* Ingredients block */}
            <div className="p-3.5 rounded-xl bg-[#fcf2e6]/70 border border-[#dfc0b7]/70 space-y-2">
              <Bone className="w-28 h-3 rounded-full mb-1" />
              {[1, 2, 3].map((c) => (
                <div key={c} className="flex items-center justify-between py-1">
                  <Bone className="w-32 h-4 rounded-full" />
                  <Bone className="w-16 h-4 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Universal Boneyard-wrapped Section
 */
export function BoneyardSection({
  name,
  loading,
  children,
  fallback,
}: {
  name: string;
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Skeleton
      name={name}
      loading={loading}
      color="#fcf2e6"
      animate="pulse"
      fallback={fallback}
    >
      {children}
    </Skeleton>
  );
}
