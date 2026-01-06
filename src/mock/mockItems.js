export const CURRENT_USER = "admin";

export const MOCK_ITEMS = [
  {
    id: "it_001",
    type: "lost",
    name: "کیف پول مشکی",
    category: "wallets",
    relatedProfile: "admin",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 min ago
    notes: "داخلش کارت دانشجویی هم بود.",
  },
  {
    id: "it_002",
    type: "lost",
    name: "کارت دانشجویی",
    category: "id_cards",
    relatedProfile: "sara",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
    notes: "",
  },
  {
    id: "it_003",
    type: "found",
    name: "کلید",
    category: "keys",
    relatedProfile: "ali",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), // 30h ago
    notes: "روی جاکلیدی یک نوشته بود.",
  },
];
