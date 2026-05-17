"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Bell,
  Building2,
  Languages,
  Sliders,
  Plug,
  Lock,
  Landmark,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  clearStoredOnboardingRegistrationState,
  isDemoAccountEmail,
} from "@/lib/demo-account";

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
  const router = useRouter();
  const { t } = useLocale();
  const { user, session, updateUser, signOut } = useAuth();
  const { business, updateBusiness } = useAppData();
  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [biz, setBiz] = useState({
    name: business.name,
    salaryGoal: String(business.salaryGoal),
  });
  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    sms: false,
    auto: true,
  });

  const [erpSettings, setErpSettings] = useState({
    origin: "https://pos.srijaya.lk",
    apiKey: "",
    username: "",
    password: "",
    branchId: "",
    entityRecent: true,
    entityRollups: false,
    entityMeta: false,
  });
  const [erpMeta, setErpMeta] = useState<{
    loading: boolean;
    hasApiKey?: boolean;
    lastSync?: string | null;
    lastErr?: string | null;
    saving: boolean;
  }>({ loading: false, saving: false });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const isDemoProfile = isDemoAccountEmail(user?.email);

  useEffect(() => {
    if (section !== "erp" || !session?.access_token) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setErpMeta((m) => ({ ...m, loading: true }));
    });
    fetch("/api/erp/integration", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data: Record<string, unknown>) => {
        if (cancelled) return;
        const originVal = data.erp_origin;
        if (typeof originVal === "string") {
          setErpSettings((s) => ({ ...s, origin: originVal }));
        }
        const sync = data.erp_sync as
          | { entities?: string[]; snapshot_params?: { branch_id?: string } }
          | undefined;
        const ent = Array.isArray(sync?.entities) ? sync.entities : ["recent_transactions"];
        setErpSettings((s) => ({
          ...s,
          branchId: typeof sync?.snapshot_params?.branch_id === "string" ? sync.snapshot_params.branch_id : "",
          entityRecent: ent.includes("recent_transactions"),
          entityRollups: ent.includes("expense_rollups"),
          entityMeta: ent.includes("meta"),
        }));
        setErpMeta({
          loading: false,
          saving: false,
          hasApiKey: !!data.has_api_key,
          lastSync: typeof data.last_synced_at === "string" ? data.last_synced_at : null,
          lastErr: typeof data.last_integration_error === "string" ? data.last_integration_error : null,
        });
      })
      .catch(() => {
        if (!cancelled) setErpMeta((m) => ({ ...m, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [section, session?.access_token]);

  useEffect(() => {
    queueMicrotask(() => {
      setBiz({
        name: business.name,
        salaryGoal: String(business.salaryGoal),
      });
    });
  }, [business.id, business.name, business.salaryGoal]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      setProfile((p) => ({
        ...p,
        name: user.name ?? p.name,
        email: user.email ?? p.email,
        phone: user.phone ?? p.phone,
      }));
    });
  }, [user]);

  const submitDeleteAccount = async () => {
    const token = session?.access_token;
    if (!token || !user?.email) return;

    setDeleteSubmitting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmation_email: deleteConfirmEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data.error === "string" ? data.error : "Could not delete account.",
        );
        return;
      }
      clearStoredOnboardingRegistrationState();
      await signOut();
      toast.success("Your account has been deleted.");
      setDeleteDialogOpen(false);
      router.replace("/");
    } finally {
      setDeleteSubmitting(false);
    }
  };

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

  const saveErpIntegration = async () => {
    const token = session?.access_token;
    if (!token) return;
    setErpMeta((m) => ({ ...m, saving: true }));
    try {
      const entities: string[] = [];
      if (erpSettings.entityRecent) entities.push("recent_transactions");
      if (erpSettings.entityRollups) entities.push("expense_rollups");
      if (erpSettings.entityMeta) entities.push("meta");
      const body: Record<string, unknown> = {
        erp_origin: erpSettings.origin.trim(),
        erp_sync: {
          entities,
          snapshot_params: {
            privacy: "strict",
            ...(erpSettings.branchId.trim() ? { branch_id: erpSettings.branchId.trim() } : {}),
          },
        },
      };
      if (erpSettings.apiKey.trim()) body.api_key = erpSettings.apiKey.trim();
      if (erpSettings.username.trim()) body.erp_username = erpSettings.username.trim();
      if (erpSettings.password) body.erp_password = erpSettings.password;
      const res = await fetch("/api/erp/integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data.error === "string" ? data.error : "Could not save ERP settings.",
        );
        return;
      }
      toast.success("Srijaya connection saved.");
      setErpSettings((s) => ({ ...s, apiKey: "", password: "" }));
      setErpMeta((m) => ({ ...m, hasApiKey: true }));
    } finally {
      setErpMeta((m) => ({ ...m, saving: false }));
    }
  };

  const testErpHealth = async () => {
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch("/api/erp/health", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error("Health check failed.");
      return;
    }
    toast.message(`ERP: ${String(data.status)} (${Number(data.latency_ms)} ms)`);
  };

  const runErpSyncFromSettings = async () => {
    const token = session?.access_token;
    if (!token) return;
    const entities: string[] = [];
    if (erpSettings.entityRecent) entities.push("recent_transactions");
    if (erpSettings.entityRollups) entities.push("expense_rollups");
    if (erpSettings.entityMeta) entities.push("meta");
    const res = await fetch("/api/erp/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        entities,
        snapshot_params: {
          privacy: "strict",
          ...(erpSettings.branchId.trim() ? { branch_id: erpSettings.branchId.trim() } : {}),
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(typeof data.details === "string" ? data.details : "Sync failed.");
      return;
    }
    toast.success(`Imported ${Number(data.records_pulled ?? 0)} new transactions.`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink-300">{t.settings.title}</h2>
        <p className="text-sm text-ink-50">{t.settings.sub}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <Card padded className="h-fit">
          <ul className="flex flex-row flex-wrap lg:flex-col lg:space-y-1 gap-1">
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
              <div className="border-t border-snow-300 pt-6 mt-6">
                <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-4 space-y-3">
                  <p className="text-sm font-semibold text-[#991B1B]">
                    {t.settings.profile.dangerTitle}
                  </p>
                  <p className="text-xs text-[#B91C1C]/90 leading-relaxed">
                    {t.settings.profile.dangerSub}
                  </p>
                  {isDemoProfile ? (
                    <p className="text-xs text-ink-50">{t.settings.profile.deleteDemoBlocked}</p>
                  ) : (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        setDeleteConfirmEmail("");
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="size-4" />
                      {t.settings.profile.deleteAccount}
                    </Button>
                  )}
                </div>
              </div>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) setDeleteConfirmEmail("");
                }}
              >
                <DialogContent className="max-w-md border-[#FECACA]">
                  <DialogHeader>
                    <DialogTitle className="text-[#991B1B]">
                      {t.settings.profile.deleteConfirmTitle}
                    </DialogTitle>
                    <DialogDescription className="text-ink-100">
                      {t.settings.profile.deleteConfirmHint}
                    </DialogDescription>
                  </DialogHeader>
                  <label className="block pt-2">
                    <span className="text-xs font-medium text-ink-100">
                      {t.settings.profile.email}
                    </span>
                    <Input
                      autoComplete="off"
                      placeholder={t.settings.profile.deletePlaceholder}
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      className="mt-1.5"
                    />
                  </label>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={deleteSubmitting}
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={
                        deleteSubmitting ||
                        deleteConfirmEmail.trim().toLowerCase() !==
                          (user?.email ?? "").trim().toLowerCase() ||
                        !session?.access_token
                      }
                      onClick={() => void submitDeleteAccount()}
                    >
                      {deleteSubmitting ? t.common.loading : t.settings.profile.deleteConfirm}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                Connect <strong>Srijaya POS</strong> via the SoleBook integration API. Data is
                pulled only for the categories you select below; snapshots default to{" "}
                <code className="text-xs">privacy=strict</code> when syncing.
              </p>

              {erpMeta.loading ? (
                <p className="text-sm text-ink-50">Loading…</p>
              ) : (
                <div className="space-y-4 text-sm">
                  {(erpMeta.lastSync || erpMeta.lastErr) && (
                    <div className="rounded-xl border border-snow-300 bg-snow-50 p-3 text-xs text-ink-100">
                      {erpMeta.lastSync && (
                        <p>
                          Last synced:{" "}
                          {new Date(erpMeta.lastSync).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      )}
                      {erpMeta.lastErr && (
                        <p className="text-red-600 mt-1">Last error: {erpMeta.lastErr}</p>
                      )}
                    </div>
                  )}

                  <Field label="ERP origin">
                    <Input
                      value={erpSettings.origin}
                      onChange={(e) =>
                        setErpSettings((s) => ({ ...s, origin: e.target.value }))
                      }
                      placeholder="https://pos.srijaya.lk"
                    />
                  </Field>

                  <p className="text-xs text-ink-50">
                    Sign in with ERP username/password below, or configure{" "}
                    <code className="text-[11px]">ERP_API_KEY</code> on the server. Open
                    optional fields only if you need a branch filter or a UI-stored integration
                    key.
                  </p>

                  <p className="text-xs font-medium text-ink-200">SoleBook JWT (ERP login)</p>
                  <FieldGrid>
                    <Field label="ERP username">
                      <Input
                        value={erpSettings.username}
                        onChange={(e) =>
                          setErpSettings((s) => ({ ...s, username: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="ERP password">
                      <Input
                        type="password"
                        autoComplete="off"
                        value={erpSettings.password}
                        onChange={(e) =>
                          setErpSettings((s) => ({ ...s, password: e.target.value }))
                        }
                      />
                    </Field>
                  </FieldGrid>

                  <details className="rounded-xl border border-snow-300 bg-white px-3 py-2 [&_summary]:cursor-pointer [&_summary]:list-none [&_summary::-webkit-details-marker]:hidden">
                    <summary className="text-sm font-medium text-ink-200 select-none">
                      Optional: integration key &amp; branch
                    </summary>
                    <div className="mt-3 space-y-3 border-t border-snow-200 pt-3">
                      <Field label="Branch ID (snapshot filter)">
                        <Input
                          value={erpSettings.branchId}
                          onChange={(e) =>
                            setErpSettings((s) => ({ ...s, branchId: e.target.value }))
                          }
                          placeholder="Only if your ERP key is scoped to a branch"
                        />
                      </Field>
                      <Field label="Integration API key (sb_…)">
                        <Input
                          type="password"
                          autoComplete="off"
                          value={erpSettings.apiKey}
                          onChange={(e) =>
                            setErpSettings((s) => ({ ...s, apiKey: e.target.value }))
                          }
                          placeholder={
                            erpMeta.hasApiKey
                              ? "•••••••• (enter new key to replace)"
                              : "Paste sb_… key from ERP admin"
                          }
                        />
                      </Field>
                    </div>
                  </details>

                  <div className="space-y-2">
                    <p className="font-medium text-ink-200">Import into database</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-snow-300"
                        checked={erpSettings.entityRecent}
                        onChange={(e) =>
                          setErpSettings((s) => ({ ...s, entityRecent: e.target.checked }))
                        }
                      />
                      <span>Recent transactions</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-snow-300"
                        checked={erpSettings.entityRollups}
                        onChange={(e) =>
                          setErpSettings((s) => ({ ...s, entityRollups: e.target.checked }))
                        }
                      />
                      <span>Expense rollups (per category)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-snow-300"
                        checked={erpSettings.entityMeta}
                        onChange={(e) =>
                          setErpSettings((s) => ({ ...s, entityMeta: e.target.checked }))
                        }
                      />
                      <span>Business meta (stored on integration, not as transactions)</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveErpIntegration}
                      disabled={erpMeta.saving}
                    >
                      {erpMeta.saving ? "Saving…" : "Save connection"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={testErpHealth}>
                      Test connection
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={runErpSyncFromSettings}>
                      Sync now
                    </Button>
                  </div>
                </div>
              )}
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
                <Field label={t.settings.business.name}>
                  <Input
                    value={biz.name}
                    onChange={(e) =>
                      setBiz((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </Field>
                <Field label={t.settings.business.plannedSalary}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={biz.salaryGoal}
                    onChange={(e) =>
                      setBiz((prev) => ({ ...prev, salaryGoal: e.target.value }))
                    }
                  />
                  <p className="mt-1 text-[11px] text-ink-50">
                    {t.settings.business.plannedSalaryHint}
                  </p>
                </Field>
              </FieldGrid>
              <SaveRow
                onSave={() => {
                  const salary = Number(biz.salaryGoal);
                  updateBusiness({
                    name: biz.name,
                    ...(Number.isFinite(salary) && salary > 0
                      ? { salaryGoal: salary }
                      : {}),
                  });
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
