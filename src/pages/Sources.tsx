import { useState } from "react";
import { Globe, Youtube, Send, Instagram, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const sourceTypes = [
  { id: "web", label: "Веб-сайты", icon: Globe, description: "Блоги и статьи" },
  { id: "youtube", label: "YouTube", icon: Youtube, description: "Видео и каналы" },
  { id: "telegram", label: "Telegram", icon: Send, description: "Каналы" },
  { id: "instagram", label: "Instagram", icon: Instagram, description: "Аккаунты" },
];

export default function Sources() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSource = async (type: string) => {
    if (!url.trim()) {
      toast.error("Введите URL источника");
      return;
    }

    setIsLoading(true);
    
    // Placeholder for actual implementation
    setTimeout(() => {
      toast.success(`Источник добавлен: ${url}`);
      setUrl("");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Источники контента</h1>
        <p className="text-muted-foreground mt-1">
          Добавляйте источники для автоматического сбора вирусного контента
        </p>
      </div>

      {/* Source Types */}
      <Tabs defaultValue="web" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          {sourceTypes.map((type) => (
            <TabsTrigger key={type.id} value={type.id} className="gap-2">
              <type.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{type.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {sourceTypes.map((type) => (
          <TabsContent key={type.id} value={type.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <type.icon className="h-5 w-5 text-primary" />
                  {type.label}
                </CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`url-${type.id}`}>URL источника</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`url-${type.id}`}
                      placeholder={
                        type.id === "web" 
                          ? "https://example.com/blog" 
                          : type.id === "youtube"
                          ? "https://youtube.com/@channel"
                          : type.id === "telegram"
                          ? "https://t.me/channel"
                          : "https://instagram.com/account"
                      }
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <Button 
                      onClick={() => handleAddSource(type.id)}
                      disabled={isLoading}
                      className="gradient-primary text-primary-foreground"
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {type.id === "web" && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Совет:</strong> Добавляйте страницы с полезными статьями о Wildberries. 
                      Система автоматически извлечёт контент и оценит его вирусность.
                    </p>
                  </div>
                )}

                {type.id === "youtube" && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Совет:</strong> Добавляйте каналы популярных экспертов по маркетплейсам.
                      Будут анализироваться просмотры и вовлечённость.
                    </p>
                  </div>
                )}

                {type.id === "telegram" && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Совет:</strong> Добавляйте публичные каналы о WB, селлерах, инвестициях.
                    </p>
                  </div>
                )}

                {type.id === "instagram" && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Совет:</strong> Добавляйте аккаунты конкурентов для анализа их контента.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Active Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Активные источники</CardTitle>
          <CardDescription>Список подключённых источников контента</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Источники не добавлены
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Добавьте первый источник выше
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
