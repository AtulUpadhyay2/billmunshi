import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { useGetProfileQuery } from "@/store/api/auth/authApiSlice";
import Loading from "@/components/Loading";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";

/**
 * Profile page.
 *
 * Was the dashboard template's profile page: a 186px avatar over a 150px dark
 * banner, `text-2xl` headings, `p-6` gradient panels and `space-y-8` lists —
 * roughly double the scale of the rest of the app. It also had no dark-mode
 * colours on any of the gradient panels (`from-blue-50`, `text-gray-900`,
 * `bg-green-100 text-green-800`), so in dark mode they rendered as light boxes.
 *
 * Rebuilt on the same card + chip + 32px-control scale the Tally pages use.
 * The template's `<Card>` is not used here any more — its `card-title` /
 * `card-body p-6` come from the old SCSS and can't be brought down to this
 * scale without changing the notifications page too.
 */
const CARD =
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl";
const CARD_HEAD =
  "flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800";
const CARD_TITLE =
  "text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300";
const CHIP =
  "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold";
const ROW = "flex items-center justify-between gap-3 py-1.5";
const ROW_LABEL = "text-[11px] text-slate-500 dark:text-slate-400";
const ROW_VALUE = "text-xs font-semibold text-slate-900 dark:text-white";

/** Chip palettes — every one carries a dark variant. */
const CHIP_TONE = {
  green:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-900/60",
  red: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 ring-1 ring-rose-100 dark:ring-rose-900/60",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60",
  purple:
    "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 ring-1 ring-purple-100 dark:ring-purple-900/60",
  amber:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-900/60",
  slate:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700",
};

const Chip = ({ tone = "slate", icon, children }) => (
  <span className={`${CHIP} ${CHIP_TONE[tone]}`}>
    {icon && <Icon icon={icon} className="text-[11px]" />}
    {children}
  </span>
);

const profile = () => {
  const { data: userProfile, error, isLoading } = useGetProfileQuery();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${CARD} p-6`}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5">
            <Icon icon="heroicons:exclamation-circle" className="text-lg" />
          </div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">
            Failed to load profile
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {error?.data?.message ||
              error?.message ||
              "An error occurred while fetching profile data"}
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatLastActive = (dateString) => {
    const now = new Date();
    const lastActive = new Date(dateString);
    const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const initials =
    (userProfile?.first_name?.charAt(0)?.toUpperCase() || "") +
      (userProfile?.last_name?.charAt(0)?.toUpperCase() || "") || "U";

  const stats = [
    {
      label: "Organizations",
      value: userProfile?.organizations?.length || 0,
    },
    { label: "Last Active", value: formatLastActive(userProfile?.last_active) },
    { label: "Member Since", value: formatDate(userProfile?.date_joined) },
  ];

  return (
    <div className="space-y-3">
      {/* Identity header. The template had a 150px dark banner behind a 186px
          avatar; the stats that used to sit in that banner are now a compact
          row beside the name. */}
      <div className={`${CARD} p-3.5 flex flex-col lg:flex-row lg:items-center gap-3.5`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            {userProfile?.profile_image ? (
              <img
                src={userProfile.profile_image}
                alt={userProfile.full_name || "Profile"}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-600 to-blue-700 ring-2 ring-blue-700/20 flex items-center justify-center">
                <span className="text-white text-base font-bold">
                  {initials}
                </span>
              </div>
            )}
            <Link
              to="#"
              title="Edit profile picture"
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              <Icon icon="heroicons:pencil-square" className="text-[11px]" />
            </Link>
          </div>

          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {userProfile?.full_name || "Unknown User"}
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {userProfile?.bio || "No bio available"}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <Chip tone={userProfile?.is_active ? "green" : "red"}>
                {userProfile?.is_active ? "Active" : "Inactive"}
              </Chip>
              {userProfile?.email_verified && (
                <Chip tone="blue" icon="heroicons:check-badge">
                  Email Verified
                </Chip>
              )}
              {userProfile?.is_staff && <Chip tone="purple">Staff</Chip>}
              {userProfile?.is_superuser && <Chip tone="amber">Admin</Chip>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:max-w-115 lg:w-full shrink-0">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2 text-center"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {s.value}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="lg:col-span-6 col-span-12 space-y-3">
          {/* Personal Information */}
          <div className={CARD}>
            <div className={CARD_HEAD}>
              <span className={CARD_TITLE}>Personal Information</span>
            </div>
            <div className="p-3.5 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="shrink-0 w-7 h-7 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <Icon icon="heroicons:envelope" className="text-sm" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Email
                  </div>
                  <a
                    href={`mailto:${userProfile?.email}`}
                    className="block text-xs font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors"
                  >
                    {userProfile?.email || "No email provided"}
                  </a>
                  <div className="mt-1">
                    {userProfile?.email_verified ? (
                      <Chip tone="green" icon="heroicons:check-circle">
                        Verified
                      </Chip>
                    ) : (
                      <Chip tone="red" icon="heroicons:x-circle">
                        Not Verified
                      </Chip>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="shrink-0 w-7 h-7 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <Icon
                    icon="heroicons:phone-arrow-up-right"
                    className="text-sm"
                  />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Phone
                  </div>
                  {userProfile?.phone_number ? (
                    <a
                      href={`tel:${userProfile.phone_number}`}
                      className="block text-xs font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {userProfile.phone_number}
                    </a>
                  ) : (
                    <span className="block text-xs text-slate-400 dark:text-slate-500 italic">
                      No phone number provided
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="shrink-0 w-7 h-7 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <Icon icon="heroicons:calendar-days" className="text-sm" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Member Since
                  </div>
                  <div className="text-xs font-medium text-slate-900 dark:text-white">
                    {formatDate(userProfile?.date_joined)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className={CARD}>
            <div className={CARD_HEAD}>
              <span className={CARD_TITLE}>Account Status</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Permissions
              </span>
            </div>
            <div className="p-3.5 divide-y divide-slate-100 dark:divide-slate-800">
              <div className={ROW}>
                <span className={ROW_LABEL}>Active status</span>
                <Chip tone={userProfile?.is_active ? "green" : "red"}>
                  {userProfile?.is_active ? "Active" : "Inactive"}
                </Chip>
              </div>
              <div className={ROW}>
                <span className={ROW_LABEL}>Staff member</span>
                <Chip tone={userProfile?.is_staff ? "purple" : "slate"}>
                  {userProfile?.is_staff ? "Yes" : "No"}
                </Chip>
              </div>
              <div className={ROW}>
                <span className={ROW_LABEL}>Administrator</span>
                <Chip tone={userProfile?.is_superuser ? "amber" : "slate"}>
                  {userProfile?.is_superuser ? "Yes" : "No"}
                </Chip>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className={CARD}>
            <div className={CARD_HEAD}>
              <span className={CARD_TITLE}>Security</span>
              <button
                type="button"
                onClick={() => setIsChangePasswordModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <Icon icon="heroicons:key" className="text-xs" />
                Change Password
              </button>
            </div>
            <div className="p-3.5">
              <div className={ROW}>
                <span className={ROW_LABEL}>Password protection</span>
                <Chip tone="green" icon="heroicons:shield-check">
                  Protected
                </Chip>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Keep your account secure by using a strong password and changing
                it regularly.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 col-span-12 space-y-3">
          {/* Organizations */}
          {userProfile?.organizations &&
            userProfile.organizations.length > 0 && (
              <div className={CARD}>
                <div className={CARD_HEAD}>
                  <span className={CARD_TITLE}>Organizations</span>
                  <Chip tone="blue">
                    {userProfile.organizations.length} organization
                    {userProfile.organizations.length > 1 ? "s" : ""}
                  </Chip>
                </div>
                <div className="p-3.5 space-y-2">
                  {userProfile.organizations.map((org) => (
                    <div
                      key={org.id}
                      className="rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 ring-1 ring-blue-700/20 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {org.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {org.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {org.unique_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Chip
                            tone={org.role === "ADMIN" ? "purple" : "blue"}
                            icon={
                              org.role === "ADMIN"
                                ? "heroicons:star"
                                : "heroicons:user"
                            }
                          >
                            {org.role}
                          </Chip>
                          <Chip
                            tone={org.status === "ACTIVE" ? "green" : "red"}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                org.status === "ACTIVE"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {org.status}
                          </Chip>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                            Role Level
                          </div>
                          <div
                            className={`mt-0.5 text-xs font-semibold ${
                              org.role === "ADMIN"
                                ? "text-purple-700 dark:text-purple-400"
                                : "text-blue-700 dark:text-blue-400"
                            }`}
                          >
                            {org.role === "ADMIN" ? "Administrator" : "Member"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                            Access Level
                          </div>
                          <div
                            className={`mt-0.5 text-xs font-semibold ${
                              org.status === "ACTIVE"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            {org.status === "ACTIVE"
                              ? "Full Access"
                              : "Limited"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Activity & Statistics */}
          <div className={CARD}>
            <div className={CARD_HEAD}>
              <span className={CARD_TITLE}>Activity &amp; Statistics</span>
            </div>
            <div className="p-3.5 divide-y divide-slate-100 dark:divide-slate-800">
              <div className={ROW}>
                <span className={ROW_LABEL}>Last active</span>
                <span className={ROW_VALUE}>
                  {formatLastActive(userProfile?.last_active)}
                </span>
              </div>
              <div className={ROW}>
                <span className={ROW_LABEL}>Organizations</span>
                <span className={ROW_VALUE}>
                  {userProfile?.organizations?.length || 0} active
                </span>
              </div>
              <div className={ROW}>
                <span className={ROW_LABEL}>User ID</span>
                <span className={`${ROW_VALUE} font-mono tabular-nums`}>
                  #{userProfile?.id}
                </span>
              </div>
              <div className={ROW}>
                <span className={ROW_LABEL}>Account type</span>
                <div className="flex items-center gap-1">
                  {userProfile?.is_superuser && <Chip tone="amber">Admin</Chip>}
                  {userProfile?.is_staff && <Chip tone="purple">Staff</Chip>}
                  {!userProfile?.is_staff && !userProfile?.is_superuser && (
                    <Chip tone="slate">User</Chip>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default profile;
