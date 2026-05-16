"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-prussian-blue flex items-center justify-center p-6 mesh-bg">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-burnt-peach flex items-center justify-center shadow-glow mb-3">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading font-bold text-bright-snow text-2xl">
            Sole<span className="text-burnt-peach">Book</span>
          </span>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Email address</label>
            <Input type="email" placeholder="nimal@myshop.lk" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-bright-snow transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full gap-2 mt-2">
            Sign In <ArrowRight className="w-4 h-4" />
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full mt-2">
              Continue in Demo Mode
            </Button>
          </Link>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/onboarding" className="text-burnt-peach hover:text-burnt-peach-400">
            Get started free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
