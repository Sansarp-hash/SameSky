import { useState } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useCodes, useCodeActions } from "@/hooks/use-codes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Ticket, Copy, Plus, Trash2, Loader2 } from "lucide-react";

export default function CodesPage() {
  const { data, isLoading } = useCodes();
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { pending, addCode, claimCode, deleteCode } = useCodeActions();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [contributor, setContributor] = useState("");

  const codes = data?.codes ?? [];
  const isAdmin = me?.role === "admin";

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const ok = await addCode(code.trim(), contributor.trim());
    if (ok) {
      setCode("");
      setContributor("");
      setOpen(false);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 lg:px-8 py-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl tracking-tight text-white">Community Codes</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-md">
            A shared pool of codes from the SameSky community. Copy one to claim it — each code can
            be used only once, then it leaves the pool.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Add code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Add a new code</DialogTitle>
              <DialogDescription>
                Share a code with the community. It will be available until someone claims it.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-white/70 uppercase">
                  Code
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter the code"
                  maxLength={200}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-white/70 uppercase">
                  Your handle <span className="text-muted-foreground normal-case">(optional)</span>
                </label>
                <Input
                  value={contributor}
                  onChange={(e) => setContributor(e.target.value)}
                  placeholder="How you'd like to be credited"
                  maxLength={80}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="rounded-full w-full" disabled={pending === "add"}>
                  {pending === "add" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add code"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : codes.length === 0 ? (
        <div className="border border-white/10 rounded-3xl bg-white/[0.02] py-20 flex flex-col items-center justify-center text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <Ticket className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-white mb-1">All codes are used</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            There are no codes available right now. Be the first to add one for the community.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((c) => {
            const canDelete = isAdmin || (me?.id != null && c.createdByUserId === me.id);
            const claiming = pending === `claim-${c.id}`;
            const deleting = pending === `delete-${c.id}`;
            return (
              <div
                key={c.id}
                className="group flex items-center gap-4 border border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-base sm:text-lg text-white tracking-wide truncate">
                    {c.code}
                  </p>
                  {c.contributor && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Shared by {c.contributor}
                    </p>
                  )}
                </div>

                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-full shrink-0"
                    onClick={() => deleteCode(c.id)}
                    disabled={deleting}
                    aria-label="Remove code"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}

                <Button
                  className="rounded-full gap-2 shrink-0"
                  onClick={() => claimCode(c.id)}
                  disabled={claiming}
                >
                  {claiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
