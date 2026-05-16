"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  ShoppingBag,
  UtensilsCrossed,
  Briefcase,
  Package,
  Globe,
  Laptop,
  Zap,
  Shield,
  User,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BusinessType } from "@/types";

const STEPS = [
  { id: 1, label: "Mode" },
  { id: 2, label: "Business" },
  { id: 3, label: "Salary" },
  { id: 4, label: "Setup" },
  { id: 5, label: "Ready" },
];

const businessTypes = [
  { id: "retail" as BusinessType, label: "Retail Shop", icon: ShoppingBag, desc: "Inventory-heavy, daily sales" },
  { id: "restaurant" as BusinessType, label: "Restaurant", icon: UtensilsCrossed, desc: "Daily ops, utilities, ingredients" },
  { id: "services" as BusinessType, label: "Services", icon: Briefcase, desc: "Salary-heavy, project-based" },
  { id: "wholesale" as BusinessType, label: "Wholesale", icon: Package, desc: "Supplier credit, bulk buying" },
  { id: "online" as BusinessType, label: "Online Business", icon: Globe, desc: "Digital, low inventory" },
  { id: "freelancer" as BusinessType, label: "Freelancer", icon: Laptop, desc: "Irregular income, personal overlap" },
];

const bucketPreview = {
  retail: [
    { label: "Operations", pct: 50, color: "#3B82F6" },
    { label: "Obligations", pct: 25, color: "#F59E0B" },
    { label: "Profit Reserve", pct: 12, color: "#22C55E" },
    { label: "Owner Salary", pct: 10, color: "#F27344" },
    { label: "Growth", pct: 3, color: "#8B5CF6" },
  ],
  restaurant: [
    { label: "Operations", pct: 55, color: "#3B82F6" },
    { label: "Obligations", pct: 22, color: "#F59E0B" },
    { label: "Profit Reserve", pct: 10, color: "#22C55E" },
    { label: "Owner Salary", pct: 10, color: "#F27344" },
    { label: "Growth", pct: 3, color: "#8B5CF6" },
  ],
  services: [
    { label: "Operations", pct: 40, color: "#3B82F6" },
    { label: "Obligations", pct: 28, color: "#F59E0B" },
    { label: "Profit Reserve", pct: 15, color: "#22C55E" },
    { label: "Owner Salary", pct: 12, color: "#F27344" },
    { label: "Growth", pct: 5, color: "#8B5CF6" },
  ],
  wholesale: [
    { label: "Operations", pct: 60, color: "#3B82F6" },
    { label: "Obligations", pct: 20, color: "#F59E0B" },
    { label: "Profit Reserve", pct: 10, color: "#22C55E" },
    { label: "Owner Salary", pct: 8, color: "#F27344" },
    { label: "Growth", pct: 2, color: "#8B5CF6" },
  ],
  online: [
    { label: "Operations", pct: 45, color: "#3B82F6" },
    { label: "Obligations", pct: 22, color: "#F59E0B" },
    { label: "Profit Reserve", pct: 15, color: "#22C55E" },
    { label: "Owner Salary", pct: 12, color: "#F27344" },
    { label: "Growth", pct: 6, color: "#8B5CF6" },
  ],
  freelancer: [
    { label: "Operations", pct: 30, color: "#3B82F6" },
    { label: "Obligations", pct: 30, color: "#F59E0B" },
    { label: "Profit Reserve", pct: 20, color: "#22C55E" },
    { label: "Owner Salary", pct: 15, color: "#F27344" },
    { label: "Growth", pct: 5, color: "#8B5CF6" },
  ],
};

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [mode, setMode] = useState<"demo" | "live" | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [salaryGoal, setSalaryGoal] = useState("80000");
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, [step]);

  const next = () => {
    setDir(1);
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const finish = () => {
    router.push("/dashboard");
  };

  const canProceed =
    step === 1
      ? mode !== null
      : step === 2
      ? businessType !== null
      : step === 3
      ? parseFloat(salaryGoal) > 0
      : true;

  const currentBuckets = businessType
    ? bucketPreview[businessType]
    : bucketPreview.retail;

  return (
    <div className="min-h-screen bg-prussian-blue flex flex-col">
      {/* Nav */}
      <div className="h-16 border-b border-border flex items-center px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-burnt-peach flex items-center justify-center shadow-glow">
            <Wallet className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-heading font-bold text-bright-snow">
            Sole<span className="text-burnt-peach">Book</span>
          </span>
        </Link>
      </div>

      {/* Progress */}
      <div className="px-6 pt-6 max-w-2xl mx-auto w-full">
        <div className="flex justify-between mb-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex flex-col items-center gap-1",
                s.id <= step ? "text-burnt-peach" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  s.id < step
                    ? "bg-burnt-peach text-white"
                    : s.id === step
                    ? "border-2 border-burnt-peach text-burnt-peach"
                    : "border border-border text-muted-foreground"
                )}
              >
                {s.id < step ? <CheckCircle className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className="text-[10px] hidden sm:block">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="relative h-1 bg-border rounded-full overflow-hidden">
          <div
            ref={progressRef}
            className="absolute h-full bg-burnt-peach rounded-full"
            style={{ width: "0%" }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={dir}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold font-heading text-bright-snow mb-2">
                    Welcome to SoleBook
                  </h2>
                  <p className="text-muted-foreground">
                    Choose how you want to get started
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setMode("demo")}>
                    <Card
                      className={cn(
                        "p-6 text-left cursor-pointer transition-all duration-200 hover:border-burnt-peach/50 h-full",
                        mode === "demo" && "border-burnt-peach bg-burnt-peach/8"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-burnt-peach/15 flex items-center justify-center mb-4">
                        <Zap className="w-5 h-5 text-burnt-peach" />
                      </div>
                      <h3 className="font-semibold text-bright-snow mb-1">Demo Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        Explore SoleBook with pre-loaded Sri Lankan retail business data. No signup needed.
                      </p>
                      {mode === "demo" && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-burnt-peach font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Selected
                        </div>
                      )}
                    </Card>
                  </button>
                  <button onClick={() => setMode("live")}>
                    <Card
                      className={cn(
                        "p-6 text-left cursor-pointer transition-all duration-200 hover:border-info/50 h-full",
                        mode === "live" && "border-info bg-info/8"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center mb-4">
                        <Wallet className="w-5 h-5 text-info" />
                      </div>
                      <h3 className="font-semibold text-bright-snow mb-1">Connect Bank</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect your Seylan Bank account to start real financial discipline tracking.
                      </p>
                      {mode === "live" && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-info font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Selected
                        </div>
                      )}
                    </Card>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold font-heading text-bright-snow mb-2">
                    What type of business do you run?
                  </h2>
                  <p className="text-muted-foreground">
                    AI will adapt allocation models based on your business behavior
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Business name (optional)</label>
                  <Input
                    placeholder="e.g. Nimal's Retail Store"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mb-4"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {businessTypes.map((bt) => (
                    <button key={bt.id} onClick={() => setBusinessType(bt.id)}>
                      <Card
                        className={cn(
                          "p-4 text-left cursor-pointer transition-all duration-200 hover:border-burnt-peach/40 h-full",
                          businessType === bt.id &&
                            "border-burnt-peach bg-burnt-peach/8"
                        )}
                      >
                        <bt.icon
                          className={cn(
                            "w-5 h-5 mb-2",
                            businessType === bt.id
                              ? "text-burnt-peach"
                              : "text-muted-foreground"
                          )}
                        />
                        <p className="text-sm font-semibold text-bright-snow">{bt.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{bt.desc}</p>
                      </Card>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6 max-w-md mx-auto"
              >
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-burnt-peach/15 flex items-center justify-center mx-auto mb-5">
                    <User className="w-7 h-7 text-burnt-peach" />
                  </div>
                  <h2 className="text-2xl font-bold font-heading text-bright-snow mb-2">
                    How much should you pay yourself?
                  </h2>
                  <p className="text-muted-foreground">
                    Set a monthly owner salary goal. SoleBook will track this and alert you if withdrawals exceed it.
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    Monthly Owner Salary Goal (Rs.)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 80000"
                    value={salaryGoal}
                    onChange={(e) => setSalaryGoal(e.target.value)}
                    className="text-xl font-bold text-center h-14"
                  />
                  <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    {[40000, 60000, 80000, 100000, 150000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setSalaryGoal(String(v))}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-lg border transition-all duration-200",
                          salaryGoal === String(v)
                            ? "border-burnt-peach bg-burnt-peach/10 text-burnt-peach"
                            : "border-border text-muted-foreground hover:border-burnt-peach/40"
                        )}
                      >
                        Rs. {(v / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                </div>
                <Card className="p-4 border-info/20 bg-info/5">
                  <p className="text-xs text-info font-medium mb-1">💡 Why this matters</p>
                  <p className="text-xs text-muted-foreground">
                    Most SME owners take money randomly. Setting a salary goal creates discipline,
                    separates personal and business finances, and improves your banking profile.
                  </p>
                </Card>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-burnt-peach/15 flex items-center justify-center mx-auto mb-5">
                    <Sparkles className="w-7 h-7 text-burnt-peach" />
                  </div>
                  <h2 className="text-2xl font-bold font-heading text-bright-snow mb-2">
                    AI Generated Your Setup
                  </h2>
                  <p className="text-muted-foreground">
                    Based on a {businessType || "retail"} business profile, here&apos;s your recommended allocation structure.
                  </p>
                </div>

                <Card className="p-6">
                  <div className="space-y-4">
                    {currentBuckets.map((bucket, i) => {
                      const icons: Record<string, React.ElementType> = {
                        Operations: Briefcase,
                        Obligations: Shield,
                        "Profit Reserve": TrendingUp,
                        "Owner Salary": User,
                        Growth: Zap,
                      };
                      const Icon = icons[bucket.label] || Briefcase;
                      return (
                        <motion.div
                          key={bucket.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bucket.color}20` }}>
                                <Icon className="w-3.5 h-3.5" style={{ color: bucket.color }} />
                              </div>
                              <span className="text-sm font-medium text-bright-snow">{bucket.label}</span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: bucket.color }}>
                              {bucket.pct}%
                            </span>
                          </div>
                          <div className="h-2 bg-border rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bucket.pct}%` }}
                              transition={{ duration: 0.7, delay: i * 0.1 + 0.2, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: bucket.color }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    These percentages adapt dynamically based on your cash flow and obligations.
                  </p>
                </Card>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center max-w-md mx-auto space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-success/20 border-2 border-success/40 flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-success" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold font-heading text-bright-snow mb-3">
                    Your SoleBook is ready! 🎉
                  </h2>
                  <p className="text-muted-foreground">
                    Financial discipline starts now. Your AI-powered cash management system is set up and ready.
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    "Smart buckets configured for your business",
                    `Owner salary goal set: Rs. ${parseInt(salaryGoal).toLocaleString()}`,
                    "AI cash allocation engine ready",
                    "Obligation tracking activated",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Button size="xl" onClick={finish} className="w-full gap-2.5 shadow-glow-lg">
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          {step < 5 && (
            <div className="flex gap-3 mt-8 max-w-md mx-auto">
              {step > 1 && (
                <Button variant="outline" onClick={back} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              )}
              <Button
                onClick={next}
                className={cn("gap-2 flex-1", !canProceed && "opacity-50")}
                disabled={!canProceed}
              >
                {step === 4 ? "Finish Setup" : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
