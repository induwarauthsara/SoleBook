"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Building2,
  Languages,
  Sliders,
  Plug,
  Lock,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Section =
  | "profile"
  | "notifications"
  | "bank"
  | "language"
  | "preferences"
  | "erp"
  | "security"
  | "business";

const SECTION_ICONS: Record<Section, typeof User> = {
  profile: User,
  notifications: Bell,
  bank: Landmark,
  language: Languages,
  preferences: Sliders,
  erp: Plug,
  security: Lock,
  business: Building2,
};

export default function SettingsPage() {
  const { t } = useLocale();
  const { user, updateUser } = useAuth();
  const { business, updateBusiness } = useAppData();
  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [biz, setBiz] = useState({ name: business.name });
  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    sms: false,
    auto: true,
  });

  const sections: { id: Section; label: string }[] = [
    { id: "profile", label: t.settings.sections.profile },
    { id: "notifications", label: t.settings.sections.notifications },
    { id: "bank", label: t.settings.sections.bank },
    { id: "language", label: t.settings.sections.language },
    { id: "preferences", label: t.settings.sections.preferences },
    { id: "erp", label: t.settings.sections.erp },
    { id: "security", label: t.settings.sections.security },
    { id: "business", label: t.settings.sections.business },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink-300">{t.settings.title}</h2>
        <p className="text-sm text-ink-50">{t.settings.sub}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <Card padded className="h-fit">
          <ul className="flex flex-row overflow-x-auto lg:flex-col lg:space-y-1 gap-1">
            {sections.map((s) => {
              const Icon = SECTION_ICONS[s.id];
              const active = section === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-peach-50 text-peach-700"
                        : "text-ink-100 hover:bg-snow-100 hover:text-ink-300",
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-4">
          {section === "profile" && (
            <SectionCard title={t.settings.sections.profile}>
              <FieldGrid>
                <Field label={t.settings.profile.name}>
                  <Input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </Field>
                <Field label={t.settings.profile.email}>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </Field>
                <Field label={t.settings.profile.phone}>
                  <Input
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </Field>
              </FieldGrid>
              <SaveRow
                onSave={() => {
                  updateUser(profile);
                  toast.success("Profile updated");
                }}
              />
            </SectionCard>
          )}

          {section === "notifications" && (
            <SectionCard title={t.settings.sections.notifications}>
              <ToggleRow
                label={t.settings.notifications.push}
                value={prefs.push}
                onChange={(v) => setPrefs((p) => ({ ...p, push: v }))}
              />
              <ToggleRow
                label={t.settings.notifications.email}
                value={prefs.email}
                onChange={(v) => setPrefs((p) => ({ ...p, email: v }))}
              />
              <ToggleRow
                label={t.settings.notifications.sms}
                value={prefs.sms}
                onChange={(v) => setPrefs((p) => ({ ...p, sms: v }))}
              />
            </SectionCard>
          )}

          {section === "bank" && (
            <SectionCard title={t.settings.sections.bank}>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-snow-300 bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-ink-300">
                      Commercial Bank — Business Current
                    </p>
                    <p className="text-xs text-ink-50">•••• 4821</p>
                  </div>
                  <Badge variant="success">Linked</Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-snow-300 bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-ink-300">
                      Sampath Bank — Reserve Savings
                    </p>
                    <p className="text-xs text-ink-50">•••• 2207</p>
                  </div>
                  <Badge variant="success">Linked</Badge>
                </div>
                <Button variant="outline">
                  <Plug className="size-4" /> Link another account
                </Button>
              </div>
            </SectionCard>
          )}

          {section === "language" && (
            <SectionCard title={t.settings.sections.language}>
              <div className="flex items-center justify-between rounded-2xl border border-snow-300 bg-white p-4">
                <p className="text-sm text-ink-200">
                  Pick the language used across the SoleBook app.
                </p>
                <LanguageSwitcher tone="light" />
              </div>
            </SectionCard>
          )}

          {section === "preferences" && (
            <SectionCard title={t.settings.sections.preferences}>
              <ToggleRow
                label="Auto-allocate incoming payments"
                value={prefs.auto}
                onChange={(v) => setPrefs((p) => ({ ...p, auto: v }))}
              />
              <ToggleRow
                label="Hide zero-balance buckets"
                value={false}
                onChange={() => {}}
              />
            </SectionCard>
          )}

          {section === "erp" && (
            <SectionCard title={t.settings.sections.erp}>
              <p className="text-sm text-ink-100">
                Connect your accounting/ERP to sync invoices and supplier
                payments. We never write back to your books without explicit
                approval.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {["QuickBooks", "Xero", "Zoho Books", "Sage", "Tally"].map(
                  (label) => (
                    <button
                      key={label}
                      type="button"
                      className="rounded-2xl border border-snow-300 bg-white p-3 text-sm font-medium text-ink-200 hover:border-peach-300 hover:bg-peach-50 transition-colors"
                      onClick={() => toast.info(`${label} sync — coming soon`)}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </SectionCard>
          )}

          {section === "security" && (
            <SectionCard title={t.settings.sections.security}>
              <ToggleRow
                label={t.settings.security.twoFactor}
                value={false}
                onChange={() => {}}
              />
              <Button variant="outline">{t.settings.security.password}</Button>
              <Button variant="ghost">{t.settings.security.sessions}</Button>
            </SectionCard>
          )}

          {section === "business" && (
            <SectionCard title={t.settings.sections.business}>
              <FieldGrid>
                <Field label="Business name">
                  <Input
                    value={biz.name}
                    onChange={(e) => setBiz({ name: e.target.value })}
                  />
                </Field>
              </FieldGrid>
              <SaveRow
                onSave={() => {
                  updateBusiness(biz);
                  toast.success("Business updated");
                }}
              />
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-100">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-snow-300 bg-white px-4 py-3">
      <span className="text-sm font-medium text-ink-200">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function SaveRow({ onSave }: { onSave: () => void }) {
  const { t } = useLocale();
  return (
    <div className="flex justify-end">
      <Button type="button" onClick={onSave}>
        {t.common.save}
      </Button>
    </div>
  );
}
