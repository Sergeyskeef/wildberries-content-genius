import { useState, useEffect } from "react";
import { Globe, Youtube, Send, Instagram, Plus, Search, Play, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startRun } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Sources() {
  const [query, setQuery] = useState("wildberries");
  const [isLoading, setIsLoading] = useState(false);

  const handleStartDiscovery = async () => {
    if (!query.trim()) {
      toast.error("Введите тему для поиска");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await startRun("discovery", { 
        queries: [query],
        limit_per_query: 5
      });
      
      if (result.status === "success") {
          toast.success(`Запущен процесс поиска аккаунтов по теме "${query}"`);
      } else {
          toast.error("Ошибка запуска");
      }
    } catch (e) {
      toast.error("Ошибка сети");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartHarvest = async () => {
    setIsLoading(true);
    try {
      const result = await startRun("harvest", { 
        accounts_limit: 5,
        posts_per_profile: 10
      });
      
      if (result.status === "success") {
          toast.success(`Запущен процесс сбора контента из активных источников`);
      } else {
          toast.error("Ошибка запуска");
      }
    } catch (e) {
      toast.error("Ошибка сети");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartScoring = async () => {
    setIsLoading(true);
    try {
      const result = await startRun("scoring");
      
      if (result.status === "success") {
          toast.success(`Запущен процесс оценки контента через AI`);
      } else {
          toast.error("Ошибка запуска");
      }
    } catch (e) {
      toast.error("Ошибка сети");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Завод Контента</h1>
        <p className="text-muted-foreground mt-1">
          Управление автоматизированными пайплайнами сбора и анализа
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Search className="h-16 w-16" />
            </div>
            <CardHeader>
                <CardTitle className="text-lg">1. Discovery</CardTitle>
                <CardDescription>Поиск новых аккаунтов-доноров</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Тема поиска</Label>
                    <Input 
                        placeholder="Например: wildberries" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Button 
                    className="w-full gradient-primary" 
                    onClick={handleStartDiscovery}
                    disabled={isLoading}
                >
                    <Search className="h-4 w-4 mr-2" /> Найти аккаунты
                </Button>
            </CardContent>
        </Card>

        <Card className="relative overflow-hidden group border-primary/20 bg-primary/5">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <RefreshCw className="h-16 w-16" />
            </div>
            <CardHeader>
                <CardTitle className="text-lg">2. Harvest</CardTitle>
                <CardDescription>Сбор постов из источников</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Запускает Apify Scraper для всех активных аккаунтов в базе.
                </p>
                <Button 
                    variant="outline"
                    className="w-full border-primary/50 text-primary hover:bg-primary/10" 
                    onClick={handleStartHarvest}
                    disabled={isLoading}
                >
                    <Play className="h-4 w-4 mr-2" /> Собрать посты
                </Button>
            </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="h-16 w-16" />
            </div>
            <CardHeader>
                <CardTitle className="text-lg">3. Scoring</CardTitle>
                <CardDescription>AI Оценка и фильтрация</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Оценка всех новых постов через OpenAI GPT-4.
                </p>
                <Button 
                    variant="secondary" 
                    className="w-full" 
                    onClick={handleStartScoring}
                    disabled={isLoading}
                >
                    <Zap className="h-4 w-4 mr-2" /> Оценить контент
                </Button>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статус интеграций</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase">Apify</span>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-medium">Connected</span>
                </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase">OpenAI</span>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-medium">GPT-4 Ready</span>
                </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase">Celery</span>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-medium">Worker Active</span>
                </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase">MinIO</span>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-medium">S3 Online</span>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
