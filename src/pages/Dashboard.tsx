import { Database, FileText, Sparkles, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Дашборд</h1>
          <p className="text-muted-foreground mt-1">
            Обзор вашего контента и аналитика
          </p>
        </div>
        <Button className="gradient-primary text-primary-foreground">
          <Sparkles className="mr-2 h-4 w-4" />
          Создать пост
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Собрано контента"
          value={0}
          description="материалов в базе"
          icon={Database}
        />
        <StatCard
          title="Сгенерировано постов"
          value={0}
          description="готовых каруселей"
          icon={FileText}
        />
        <StatCard
          title="Вирусность"
          value="—"
          description="средний показатель"
          icon={TrendingUp}
        />
        <StatCard
          title="Источников"
          value={0}
          description="подключено"
          icon={Sparkles}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>
              Начните работу с контентом
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/sources">
                <Database className="mr-3 h-5 w-5 text-primary" />
                Добавить источник контента
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/content">
                <FileText className="mr-3 h-5 w-5 text-accent" />
                Просмотреть базу контента
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/generator">
                <Sparkles className="mr-3 h-5 w-5 text-warning" />
                Сгенерировать новый пост
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
            <CardDescription>
              История ваших действий
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Пока нет активности
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Добавьте источники и начните собирать контент
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
