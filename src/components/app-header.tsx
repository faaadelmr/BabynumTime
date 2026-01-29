import { Baby, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  onEditBirthDate: () => void;
  showActions: boolean;
};

export default function AppHeader({ onEditBirthDate, showActions }: AppHeaderProps) {
  return (
    <header className="w-full border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 text-primary p-2 rounded-lg">
            <Baby className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-foreground">
            Babynum Time
          </h1>
        </div>
        {showActions && (
           <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onEditBirthDate} aria-label="Pengaturan">
                <Settings className="h-4 w-4" />
            </Button>
           </div>
        )}
      </div>
    </header>
  );
}
