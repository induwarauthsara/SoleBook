"use client";

import React from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Wallet, Plug } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { mockBusiness } from "@/lib/mock-data";

const sections = [
  { icon: User, label: "Profile" },
  { icon: Bell, label: "Notifications" },
  { icon: Shield, label: "Security" },
  { icon: Wallet, label: "Bank Connection" },
  { icon: Plug, label: "Integrations" },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-bright-snow">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your business profile, notifications, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="space-y-1">
          {sections.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                i === 0
                  ? "bg-burnt-peach/15 text-burnt-peach"
                  : "text-muted-foreground hover:text-bright-snow hover:bg-surface"
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div className="xl:col-span-3 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Business Name</label>
                  <Input defaultValue={mockBusiness.name} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Business Type</label>
                  <Input defaultValue="Retail Shop" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Owner Name</label>
                  <Input defaultValue="Nimal Perera" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Monthly Salary Goal (Rs.)</label>
                  <Input defaultValue="80000" type="number" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button size="sm">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface-elevated">
                <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-info" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-bright-snow">Seylan Bank</p>
                  <p className="text-xs text-muted-foreground">Demo mode — no real connection</p>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
