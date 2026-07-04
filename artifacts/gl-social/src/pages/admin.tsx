import { Card } from "@/components/ui/card";
export default function AdminPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black uppercase tracking-tight text-black">Admin Panel</h1>
      <Card className="p-6 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        <p className="font-bold text-lg">Admin dashboard implementation</p>
      </Card>
    </div>
  );
}
