"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  Users,
  ArrowRight,
  MapPin,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppStats } from "@/types";

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <>{count}</>;
}

const FEATURES = [
  {
    icon: Package,
    title: "Report Lost Items",
    description: "Quickly post details about your lost belongings with photos",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find items by text or image similarity using visual matching",
  },
  {
    icon: ShieldCheck,
    title: "Verified Claims",
    description: "Secure claim process ensures items reach their rightful owner",
  },
];

export default function HomePage() {
  const [stats, setStats] = useState<AppStats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((json) => setStats(json.data ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-24 md:py-32 overflow-hidden bg-gradient-to-b from-[#1A2744] via-[#1e2f54] to-[#243260]">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#E8A020]/10 blur-[100px]" />
          <div className="absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-[#E8A020]/5 blur-[80px]" />
          <div className="absolute -bottom-16 right-1/4 h-64 w-64 rounded-full bg-blue-500/5 blur-[80px]" />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-[#E8A020]" />
            <span className="text-xs font-medium text-white/60 tracking-wide uppercase">
              CityU of Hong Kong
            </span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
            CityUHK
            <br />
            <span className="bg-gradient-to-r from-[#E8A020] to-[#F5C060] bg-clip-text text-transparent">
              Lost &amp; Found
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-white/50 max-w-md mx-auto leading-relaxed">
            Reuniting belongings with their owners across campus
          </p>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative z-10 mt-14 grid grid-cols-3 gap-6 md:gap-16"
          >
            {[
              { label: "Total Posts", value: stats.totalPosts, icon: Package },
              { label: "Items Claimed", value: stats.totalClaimed, icon: ShieldCheck },
              { label: "Active Users", value: stats.totalUsers, icon: Users },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/5 border border-white/10 mb-3">
                  <stat.icon className="h-4 w-4 text-[#E8A020]" />
                </div>
                <p className="text-3xl md:text-4xl font-bold font-serif text-white tabular-nums">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="text-xs text-white/40 mt-1 tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative z-10 mt-14 flex flex-col items-center gap-4"
        >
          <p className="text-sm text-white/40">
            Login with your campus account to get started
          </p>
          <Button
            asChild
            size="lg"
            className="bg-[#E8A020] hover:bg-[#d4911a] text-[#1A2744] font-semibold px-10 text-base shadow-lg shadow-[#E8A020]/20 transition-all hover:shadow-xl hover:shadow-[#E8A020]/30"
          >
            <Link href="/login">
              Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Features Strip */}
      <section className="bg-[#F8F6F2] border-t border-[#ECEAE6]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center px-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A2744] text-white mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif font-semibold text-[#1A2744] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#625E58] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A2744] py-5 text-center">
        <p className="text-xs text-white/30">
          CityU Lost &amp; Found v0.1.0
        </p>
      </footer>
    </div>
  );
}
