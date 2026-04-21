import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useOpsTasks, CATEGORY_LABELS } from "@/hooks/useOpsTasks";
import { useSupplyRequests } from "@/hooks/useSupplyRequests";
import { CheckCircle2, ShoppingCart, Wrench, Building2, Search, Trophy } from "lucide-react";
import { format } from "date-fns";

const TERMINAL_TASK = ["done", "cancelled", "cannot_complete"];
const TERMINAL_SUPPLY = ["closed"];

type DoneItem = {
  id: string;
  title: string;
  source: "ops_task" | "supply";
  bucket: "shopping" | "ops" | "facilities";
  owner?: string;
  category?: string;
  completedAt: string;
  status: string;
  notes?: string | null;
};

export default function AccomplishedTasks() {
  const { data: tasks = [], isLoading: tl } = useOpsTasks();
  const { data: supply = [], isLoading: sl } = useSupplyRequests();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const items: DoneItem[] = useMemo(() => {
    const fromTasks = tasks
      .filter((t) => TERMINAL_TASK.includes(t.status))
      .map((t): DoneItem => ({
        id: t.id,
        title: t.title,
        source: "ops_task",
        bucket: t.task_mode === "facility_request" ? "facilities" : "ops",
        owner: t.main_owner?.name,
        category: t.category,
        completedAt: t.actual_completion_date || t.updated_at,
        status: t.status,
        notes: t.notes,
      }));
    const fromSupply = supply
      .filter((r) => TERMINAL_SUPPLY.includes(r.status))
      .map((r): DoneItem => ({
        id: r.id,
        title: r.title,
        source: "supply",
        bucket: "shopping",
        owner: r.requested_by,
        category: r.category,
        completedAt: r.updated_at,
        status: r.status,
        notes: r.notes,
      }));
    return [...fromTasks, ...fromSupply].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }, [tasks, supply]);

  // Shopping = supply + non-facility ops tasks (matches Shopping List dashboard scope)
  const shopping = items.filter((i) => i.bucket === "shopping" || i.bucket === "ops");
  const ops = items.filter((i) => i.bucket === "ops");
  const facilities = items.filter((i) => i.bucket === "facilities");

  const filterBySearch = (list: DoneItem[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.owner?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
    );
  };

  const counts = {
    all: items.length,
    shopping: shopping.length,
    ops: ops.length,
    facilities: facilities.length,
  };

  const sourceIcon = (b: DoneItem["bucket"]) =>
    b === "shopping" ? (
      <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" />
    ) : b === "facilities" ? (
      <Building2 className="h-3.5 w-3.5 text-blue-600" />
    ) : (
      <Wrench className="h-3.5 w-3.5 text-yellow-600" />
    );

  const bucketLabel = (b: DoneItem["bucket"]) =>
    b === "shopping" ? "Shopping" : b === "facilities" ? "Facilities" : "Ops";

  const Row = ({ item }: { item: DoneItem }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border border-border/50 bg-background hover:bg-muted/40 text-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        {sourceIcon(item.bucket)}
        <span className="font-medium truncate">{item.title}</span>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {bucketLabel(item.bucket)}
        </Badge>
        {item.category && (
          <span className="text-xs text-muted-foreground hidden md:inline truncate">
            · {(CATEGORY_LABELS as any)[item.category] || item.category.replace(/_/g, " ")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-2">
        {item.owner && (
          <span className="text-xs text-muted-foreground hidden md:inline">{item.owner}</span>
        )}
        <span className="text-xs text-muted-foreground">
          {format(new Date(item.completedAt), "MMM d, yyyy")}
        </span>
      </div>
    </div>
  );

  const List = ({ list }: { list: DoneItem[] }) => {
    const filtered = filterBySearch(list);
    if (filtered.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No accomplished items yet.
        </p>
      );
    }
    return <div className="space-y-1.5">{filtered.map((i) => <Row key={`${i.source}-${i.id}`} item={i} />)}</div>;
  };

  if (tl || sl) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          Accomplished Tasks
        </h1>
        <p className="text-muted-foreground text-sm">
          Everything that's been completed across Shopping, Ops, and Facilities
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "All Completed", value: counts.all, color: "bg-emerald-100 text-emerald-700" },
          { label: "Shopping", value: counts.shopping, color: "bg-emerald-100 text-emerald-700" },
          { label: "Ops Tasks", value: counts.ops, color: "bg-yellow-100 text-yellow-700" },
          { label: "Facilities", value: counts.facilities, color: "bg-blue-100 text-blue-700" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className={`text-2xl font-bold mt-1 inline-block px-2 rounded ${c.color}`}>
                {c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search title, owner, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Completed Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="shopping">Shopping ({counts.shopping})</TabsTrigger>
              <TabsTrigger value="ops">Ops ({counts.ops})</TabsTrigger>
              <TabsTrigger value="facilities">Facilities ({counts.facilities})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <List list={items} />
            </TabsContent>
            <TabsContent value="shopping" className="mt-4">
              <List list={shopping} />
            </TabsContent>
            <TabsContent value="ops" className="mt-4">
              <List list={ops} />
            </TabsContent>
            <TabsContent value="facilities" className="mt-4">
              <List list={facilities} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
