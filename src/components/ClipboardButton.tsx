import * as React from "react";
import { Button } from "./ui/button";
import { Clipboard } from "lucide-react";
import { Check } from "lucide-react";

export default function ClipboardButton({
  textForCopying,
  children,
}: {
  textForCopying: string;
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = React.useState(true);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textForCopying);
    setEnabled(false);
    setTimeout(() => setEnabled(true), 800);
  };

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      className="border-[hsl(224,12%,16%)] bg-transparent text-[hsl(210,20%,80%)] transition-all hover:border-[hsl(224,12%,22%)] hover:bg-[hsl(225,16%,10%)] hover:text-[hsl(210,20%,92%)]"
    >
      {enabled ? (
        <>
          <Clipboard className="h-3.5 w-3.5" />
          {children}
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5 text-[hsl(152,60%,55%)]" />
          <span className="text-[hsl(152,60%,55%)]">Copied!</span>
        </>
      )}
    </Button>
  );
}
