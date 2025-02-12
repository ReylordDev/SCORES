import { SetStateAction } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

export default function ClusterSearchbar({
  searchTerm,
  setSearchTerm,
  placeholder,
  className,
}: {
  searchTerm: string;
  setSearchTerm: (value: SetStateAction<string>) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        id="search"
        className="pl-16 text-xl h-16"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Search className="pointer-events-none absolute left-6 top-1/2 size-6 -translate-y-1/2 select-none opacity-50" />
    </div>
  );
}
