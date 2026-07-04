import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface CommunityCode {
  id: number;
  code: string;
  contributor: string | null;
  createdByUserId: number | null;
  createdAt: string;
}

const CODES_KEY = ["community-codes"];

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");
  return res.json();
}

async function sendJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

export function useCodes() {
  return useQuery<{ codes: CommunityCode[]; total: number }>({
    queryKey: CODES_KEY,
    queryFn: () => getJson("/api/codes"),
  });
}

export function useCodeActions() {
  const [pending, setPending] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refresh = () => queryClient.invalidateQueries({ queryKey: CODES_KEY });

  async function addCode(code: string, contributor: string): Promise<boolean> {
    setPending("add");
    try {
      await sendJson("/api/codes", "POST", { code, contributor });
      toast({ title: "Code added", description: "Thank you for contributing to the community." });
      refresh();
      return true;
    } catch (err) {
      toast({
        title: "Could not add code",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setPending(null);
    }
  }

  async function claimCode(id: number) {
    setPending(`claim-${id}`);
    try {
      const data = await sendJson<{ code: string }>(`/api/codes/${id}/claim`, "POST");
      await copyToClipboard(data.code).catch(() => {});
      toast({ title: "Code copied", description: "The code is on your clipboard and has been claimed." });
      refresh();
    } catch (err) {
      toast({
        title: "Could not claim code",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      refresh();
    } finally {
      setPending(null);
    }
  }

  async function deleteCode(id: number) {
    setPending(`delete-${id}`);
    try {
      await sendJson(`/api/codes/${id}`, "DELETE");
      toast({ title: "Code removed" });
      refresh();
    } catch (err) {
      toast({
        title: "Could not remove code",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(null);
    }
  }

  return { pending, addCode, claimCode, deleteCode };
}
