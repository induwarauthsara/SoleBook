"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Sparkles,
  Shield,
  TrendingUp,
  AlertCircle,
  User,
  Wallet,
  CheckCircle,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatShortCurrency } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    icon: Sparkles,
    title: "AI Cash Allocation",
    description:
      "AI analyzes your business type, upcoming obligations, and spending patterns to recommend smart fund splits — not fixed ratios.",
    color: "#F27344",
  },
  {
    icon: Shield,
    title: "Smart Buckets",
    description:
      "Operations, Obligations, Profit Reserve, Owner Salary, and Growth — every rupee has a purpose and a destination.",
    color: "#22C55E",
  },
  {
    icon: AlertCircle,
    title: "Obligation Forecasting",
    description:
      "Never miss rent, salaries, or loan payments. AI tracks due dates and reserves funds weeks in advance.",
    color: "#F59E0B",
  },
  {
    icon: User,
    title: "Owner Salary",
    description:
      "Pay yourself like an employee. Structured owner compensation eliminates random withdrawals and builds real financial discipline.",
    color: "#3B82F6",
  },
  {
    icon: TrendingUp,
    title: "Cash Flow Prediction",
    description:
      "See your balance trajectory 7, 14, or 30 days ahead. Know about shortages before they become emergencies.",
    color: "#8B5CF6",
  },
  {
    icon: Star,
    title: "Discipline Score",
    description:
      "Track your financial behavior with a real score. Higher scores unlock better loan rates and banking partnerships.",
    color: "#EF4444",
  },
];

const problems = [
  "Personal and business money in one account",
  "No idea of actual monthly profit",
  "Forgot a cheque due date — penalty paid",
  "Supplier payment delayed cash flow",
  "Emergency withdrew all savings",
  "Bank rejected business loan application",
];

const stats = [
  { value: "Rs. 892K", label: "Avg. SME monthly revenue tracked" },
  { value: "68%", label: "Discipline score improvement in 3 months" },
  { value: "94%", label: "Obligation payments made on time" },
  { value: "3.2x", label: "Faster loan approval for users" },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero title word-by-word reveal
      if (titleRef.current) {
        const words = titleRef.current.querySelectorAll(".word");
        gsap.fromTo(
          words,
          { opacity: 0, y: 40, rotateX: -20 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.3,
          }
        );
      }

      // Subtitle
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, delay: 1.0, ease: "power2.out" }
        );
      }

      // Floating cards
      if (card1Ref.current) {
        gsap.to(card1Ref.current, {
          y: -16,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        });
      }
      if (card2Ref.current) {
        gsap.to(card2Ref.current, {
          y: 12,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: 0.5,
        });
      }

      // Stats counter
      if (statsRef.current) {
        ScrollTrigger.create({
          trigger: statsRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.fromTo(
              statsRef.current!.querySelectorAll(".stat-item"),
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
            );
          },
          once: true,
        });
      }

      // Features
      if (featuresRef.current) {
        ScrollTrigger.create({
          trigger: featuresRef.current,
          start: "top 75%",
          onEnter: () => {
            gsap.fromTo(
              featuresRef.current!.querySelectorAll(".feature-card"),
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
            );
          },
          once: true,
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const titleWords = ["From", "Cash", "Chaos", "to", "Financial", "Control."];

  return (
    <div className="min-h-screen bg-[#050812] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass-dark border-b border-white/[0.08] flex items-center px-6 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-burnt-peach flex items-center justify-center shadow-[0_0_24px_rgba(242,115,68,0.34)]">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-heading font-bold text-bright-snow text-lg leading-none">
              Sole<span className="text-burnt-peach">Book</span>
            </span>
            <p className="text-[9px] uppercase tracking-[0.26em] text-muted-foreground">
              SME discipline layer
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
          <Link href="/onboarding">
            <Button size="sm" className="gap-2">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center pt-16 mesh-bg overflow-hidden"
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 control-grid opacity-80" />

        {/* Floating cards */}
        <div
          ref={card1Ref}
          className="absolute right-8 top-32 hidden 2xl:block w-64 opacity-70"
          style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))" }}
        >
          <Card className="p-4 glass border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-success" />
              </div>
              <span className="text-xs font-semibold text-bright-snow">AI Recommendation</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Operations", pct: 50, color: "#3B82F6" },
                { label: "Obligations", pct: 25, color: "#F59E0B" },
                { label: "Reserve", pct: 15, color: "#22C55E" },
                { label: "Owner Salary", pct: 10, color: "#F27344" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-20 shrink-0">{b.label}</span>
                  <div className="flex-1 h-1 bg-border rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: b.color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right">{b.pct}%</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 text-[10px] bg-burnt-peach text-white rounded-md py-1 font-semibold">Accept</button>
              <button className="flex-1 text-[10px] border border-border text-muted-foreground rounded-md py-1">Adjust</button>
            </div>
          </Card>
        </div>

        <div
          ref={card2Ref}
          className="absolute right-20 bottom-32 hidden 2xl:block w-52 opacity-70"
          style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))" }}
        >
          <Card className="p-4 glass border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-bright-snow">Discipline Score</span>
              <span className="text-xs text-success font-bold">+4 ↑</span>
            </div>
            <div className="text-3xl font-bold font-heading text-burnt-peach">68</div>
            <div className="text-xs text-muted-foreground mt-0.5">Good · Improving</div>
            <div className="mt-2 h-1.5 bg-border rounded-full">
              <div className="h-full rounded-full bg-burnt-peach" style={{ width: "68%" }} />
            </div>
          </Card>
        </div>

        <div className="relative z-10 grid max-w-6xl mx-auto px-6 md:px-10 py-24 lg:grid-cols-[1.03fr_0.97fr] gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-burnt-peach/30 bg-burnt-peach/10 px-4 py-1.5 mb-8"
            >
              <Sparkles className="w-3.5 h-3.5 text-burnt-peach" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-burnt-peach">
                AI Financial Discipline Engine
              </span>
            </motion.div>

            <h1
              ref={titleRef}
              className="text-4xl md:text-6xl lg:text-7xl font-bold font-heading leading-[0.96] mb-6 perspective-1000"
            >
              {titleWords.map((word, i) => (
                <span
                  key={i}
                  className={`word inline-block mr-3 md:mr-4 ${
                    word === "Chaos" ? "gradient-text" : "text-bright-snow"
                  }`}
                  style={{ opacity: 0 }}
                >
                  {word}
                </span>
              ))}
            </h1>

            <p
              ref={subtitleRef}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10"
              style={{ opacity: 0 }}
            >
              A black-box-free control layer for SME cash: reserve obligations,
              protect owner salary, and move money into the right bucket before
              daily spending takes over.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/onboarding">
                <Button size="xl" className="gap-2.5">
                  Try Demo Free <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="xl" className="gap-2">
                  View Control Room <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="grid gap-3 mt-8 sm:grid-cols-3"
            >
              {["No bank switch", "AI recommends first", "Built for Sri Lankan SMEs"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-burnt-peach" />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-6 rounded-[2.5rem] bg-burnt-peach/10 blur-3xl" />
            <Card className="relative overflow-hidden rounded-[2rem] p-6">
              <div className="absolute inset-x-8 top-0 h-px peach-rule" />
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-burnt-peach">
                    Live Cash State
                  </p>
                  <h3 className="mt-1 font-heading text-2xl font-bold text-bright-snow">
                    Rs. 558K
                  </h3>
                </div>
                <div className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                  Caution
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  { label: "Operations", pct: 50, color: "#3B82F6", amount: "245K" },
                  { label: "Obligations", pct: 25, color: "#F59E0B", amount: "128K" },
                  { label: "Profit Reserve", pct: 15, color: "#22C55E", amount: "95K" },
                  { label: "Owner Salary", pct: 10, color: "#F27344", amount: "62K" },
                ].map((bucket) => (
                  <div key={bucket.label}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{bucket.label}</span>
                      <span className="font-semibold text-bright-snow">Rs. {bucket.amount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.055]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${bucket.pct}%`,
                          background: `linear-gradient(90deg, ${bucket.color}88, ${bucket.color})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-burnt-peach/20 bg-burnt-peach/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-burnt-peach">
                  AI Action
                </p>
                <p className="mt-2 text-sm text-bright-snow">
                  Reserve shop rent and staff salaries before accepting new inventory spend.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Problem section */}
      <section className="py-20 px-6 md:px-10 bg-[#080D1A]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-burnt-peach mb-3">
              The real SME problem
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-bright-snow mb-4">
              Most SMEs fail not because they{" "}
              <span className="gradient-text">lack revenue.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              They fail because money timing is unmanaged, obligations are not reserved,
              and owners withdraw emotionally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
            {problems.map((problem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-burnt-peach shrink-0" />
                <span className="text-sm text-muted-foreground">{problem}</span>
              </motion.div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-burnt-peach/20 bg-burnt-peach/10 p-6 text-center">
            <p className="text-2xl font-bold font-heading text-bright-snow">
              SoleBook turns messy cash behavior into <span className="gradient-text">visible discipline.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-16 px-6 md:px-10 border-y border-white/[0.08] bg-[#050812]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="stat-item text-center" style={{ opacity: 0 }}>
              <div className="text-3xl md:text-4xl font-bold font-heading gradient-text mb-2">
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 md:px-10 bg-[#050812]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-burnt-peach mb-3">
              Product surface
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-bright-snow mb-4">
              Not accounting software. A discipline layer.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Not another accounting app. An AI-powered behavioral financial management platform
              that works on top of what you already have.
            </p>
          </div>

          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div key={i} className="feature-card" style={{ opacity: 0 }}>
                <Card
                  glow
                  className="p-5 h-full hover:translate-y-[-3px] transition-transform duration-300"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}18` }}
                  >
                    <feature.icon
                      className="w-5 h-5"
                      style={{ color: feature.color }}
                    />
                  </div>
                  <h3 className="font-heading font-semibold text-bright-snow mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-10 bg-[#050812]">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-[2rem] border border-burnt-peach/20 p-12"
            style={{ background: "linear-gradient(145deg, rgba(242,115,68,0.12) 0%, rgba(8,13,26,0.96) 54%, rgba(17,24,39,0.96) 100%)" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-burnt-peach/20 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-7 h-7 text-burnt-peach" />
            </div>
            <h2 className="text-3xl font-bold font-heading text-bright-snow mb-4">
              Start building financial discipline today.
            </h2>
            <p className="text-muted-foreground mb-8">
              Join SME owners who transformed their cash management with SoleBook.
              No bank switch. No accountant required. Just discipline.
            </p>
            <Link href="/onboarding">
              <Button size="xl" className="gap-2.5 shadow-glow-lg">
                Get Started — It&apos;s Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#050812] py-8 px-6 md:px-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-burnt-peach flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading font-bold text-bright-snow">
              Sole<span className="text-burnt-peach">Book</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 SoleBook · AI Financial Discipline for SMEs · Built for Sri Lankan Businesses
          </p>
        </div>
      </footer>
    </div>
  );
}
