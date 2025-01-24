import * as React from "react";
import { Button } from "./ui/button";
import { Clipboard } from "lucide-react";
import { Check } from "lucide-react";

export default function ClipboardButton({
  textForCopying,
}: {
  textForCopying: string;
}) {
  const [enabled, setEnabled] = React.useState(true);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textForCopying);
    setEnabled(false);
    setTimeout(() => setEnabled(true), 800);
  };

  return (
    <Button className="" onClick={handleCopy}>
      {enabled ? (
        <>
          <Clipboard />
          Calendar Link
        </>
      ) : (
        <>
          <Check />
          Copied!
        </>
      )}
    </Button>
  );
}
