"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, EXPERIENCE_LEVELS } from "@/lib/types";

const ANY = "__any__";

export function StatsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [role, setRole] = useState(searchParams.get("role") ?? "");
  const [experience, setExperience] = useState(
    searchParams.get("experience_level") ?? "",
  );
  const [country, setCountry] = useState(searchParams.get("country") ?? "");
  const [currency, setCurrency] = useState(searchParams.get("currency") ?? "");

  useEffect(() => {
    setRole(searchParams.get("role") ?? "");
    setExperience(searchParams.get("experience_level") ?? "");
    setCountry(searchParams.get("country") ?? "");
    setCurrency(searchParams.get("currency") ?? "");
  }, [searchParams]);

  function apply() {
    const params = new URLSearchParams();
    if (role.trim()) params.set("role", role.trim());
    if (experience) params.set("experience_level", experience);
    if (country.trim()) params.set("country", country.trim());
    if (currency) params.set("currency", currency);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/stats?${qs}` : "/stats");
    });
  }

  function reset() {
    setRole("");
    setExperience("");
    setCountry("");
    setCurrency("");
    startTransition(() => {
      router.replace("/stats");
    });
  }

  const hasFilters =
    role.trim() !== "" ||
    experience !== "" ||
    country.trim() !== "" ||
    currency !== "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="stats-role">Role</Label>
        <Input
          id="stats-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Engineer"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stats-experience">Experience level</Label>
        <Select
          value={experience || ANY}
          onValueChange={(v) => setExperience(v === ANY ? "" : v)}
        >
          <SelectTrigger id="stats-experience">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {EXPERIENCE_LEVELS.map((lvl) => (
              <SelectItem key={lvl} value={lvl}>
                {lvl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stats-country">Country</Label>
        <Input
          id="stats-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="e.g. Sri Lanka"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stats-currency">Currency</Label>
        <Select
          value={currency || ANY}
          onValueChange={(v) => setCurrency(v === ANY ? "" : v)}
        >
          <SelectTrigger id="stats-currency">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" className="flex-1">
          <Filter className="h-4 w-4" />
          Apply
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            aria-label="Reset filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
