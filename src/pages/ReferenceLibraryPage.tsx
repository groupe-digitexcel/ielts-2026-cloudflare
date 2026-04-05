import { useEffect, useState } from "react";
import { fetchReferenceSets } from "../lib/api";
import ReferenceList from "../components/ReferenceList";

export default function ReferenceLibraryPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchReferenceSets()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return <ReferenceList items={items} />;
}
