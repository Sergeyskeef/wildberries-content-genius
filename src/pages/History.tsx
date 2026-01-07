import { useState, useEffect } from "react";
import { Clock, Play, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchRuns } from "@/lib/api";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Run = {
  id: number;
  type: string;
  status: string;
  config_snapshot: any;
  stats: any;
  error_log: string | null;
  started_at: string;
  finished_at: string | null;
};

export default function History() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRuns = async () => {
      try {
        const data = await fetchRuns();
        setRuns(data);
      } catch (e) {
        console.error("Failed to fetch runs", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadRuns();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Завершено</Badge>;
      case "running":
        return <Badge variant="secondary" className="animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Выполняется</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Ошибка</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Ожидание</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Запуски системы</h1>
        <p className="text-muted-foreground mt-1">
          Мониторинг процессов сбора и анализа данных
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Последние активности
          </CardTitle>
          <CardDescription>
            История выполнения задач Discovery, Harvest и Scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">История пуста</h3>
              <p className="text-muted-foreground">Запустите первый процесс во вкладке "Источники"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <div key={run.id} className="p-4 rounded-lg border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Play className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold uppercase text-sm tracking-wider">{run.type}</span>
                        {getStatusBadge(run.status)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ID: #{run.id} • {format(new Date(run.started_at), "d MMMM, HH:mm:ss", { locale: ru })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {run.stats && (
                      <div className="text-sm font-medium">
                        {run.stats.found && <span>Найдено: {run.stats.found} </span>}
                        {run.stats.saved && <span>Сохранено: {run.stats.saved}</span>}
                        {run.stats.scored && <span>Оценено: {run.stats.scored}</span>}
                      </div>
                    )}
                    {run.finished_at && (
                      <div className="text-xs text-muted-foreground">
                        Завершено за {Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}с
                      </div>
                    )}
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
