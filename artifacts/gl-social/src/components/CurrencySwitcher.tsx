import { useCurrency } from "@/hooks/use-currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins } from "lucide-react";

function currencyLabel(code: string): string {
  try {
    const name = new Intl.DisplayNames(undefined, { type: "currency" }).of(code);
    return name ? `${code} — ${name}` : code;
  } catch {
    return code;
  }
}

export function CurrencySwitcher({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency, supportedCurrencies, isLoading } = useCurrency();

  const options = supportedCurrencies.includes(currency)
    ? supportedCurrencies
    : [currency, ...supportedCurrencies];

  return (
    <Select value={currency} onValueChange={setCurrency} disabled={isLoading}>
      <SelectTrigger
        className={
          compact
            ? "h-9 w-[92px] rounded-full border-white/10 bg-white/5 text-xs font-medium"
            : "h-10 w-full rounded-full border-white/10 bg-white/5 text-sm"
        }
        aria-label="Display currency"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Coins className="h-3.5 w-3.5 text-primary shrink-0" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((code) => (
          <SelectItem key={code} value={code} className="text-sm">
            {compact ? code : currencyLabel(code)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
