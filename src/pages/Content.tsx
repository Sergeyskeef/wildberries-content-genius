import { useState, useEffect } from "react";
import { Database, Search, ExternalLink, Sparkles, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchContent, approveIdea } from "@/lib/api";
import { toast } from "sonner";

type ContentItem = {
  id: number;
  url: string;
  platform: string;
  caption: string;
  score: number | null;
  status: string;
  metadata_info: any;
};

export default function Content() {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const data = await fetchContent();
      setItems(data);
    } catch (e) {
      console.error("Failed to load content", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await approveIdea(id);
      if (res.status === "success") {
        toast.success("Идея одобрена! Генерация запущена.");
        setItems(prev => prev.map(item => item.id === id ? { ...item, status: "approved" } : item));
      } else {
        toast.error("Ошибка при одобрении");
      }
    } catch (e) {
      toast.error("Ошибка сети");
    }
  };

  const filteredItems = items.filter(item => 
    item.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">База контента</h1>
          <p className="text-muted-foreground mt-1">
            Материалы, отобранные и оцененные AI
          </p>
        </div>
        <Button onClick={loadContent} variant="outline" size="sm">
          Обновить
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по контенту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Материалы ({filteredItems.length})
          </CardTitle>
          <CardDescription>
            Отсортировано по AI Score (вероятность виральности)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Ничего не найдено</h3>
              <p className="text-muted-foreground">Запустите Discovery и Harvest в разделе "Источники"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="uppercase text-[10px]">{item.platform}</Badge>
                        <span className="text-xs text-muted-foreground">ID: #{item.id}</span>
                        {item.status === "approved" && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Одобрено</Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">{item.caption || "Без описания"}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                          <ExternalLink className="h-3 w-3" /> Источник
                        </a>
                        {item.metadata_info?.views && <span>👁️ {item.metadata_info.views}</span>}
                        {item.metadata_info?.likes && <span>❤️ {item.metadata_info.likes}</span>}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded font-bold text-lg">
                        <Star className="h-4 w-4 fill-yellow-500" />
                        {item.score || 0}
                      </div>
                      {item.status !== "approved" && item.status !== "completed" && (
                        <Button size="sm" onClick={() => handleApprove(item.id)} className="gradient-primary">
                          <Sparkles className="h-4 w-4 mr-2" /> В работу
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
