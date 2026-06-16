import { useState, useRef, useEffect } from "react";

export function useNoChangesHint() {
  const [showNoChanges, setShowNoChanges] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashNoChanges = () => {
    setShowNoChanges(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowNoChanges(false), 3000);
  };

  const hideNoChanges = () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setShowNoChanges(false);
  };

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  return { showNoChanges, flashNoChanges, hideNoChanges };
}