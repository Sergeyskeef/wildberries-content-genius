import { Clock, Download, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function History() {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">История генераций</h1>
        <p className="text-muted-foreground mt-1">
          Все созданные посты и карусели
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Сгенерированные посты
          </CardTitle>
          <CardDescription>
            Отсортировано по дате создания
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              История пуста
            </h3>
            <p className="text-muted-foreground max-w-md">
              Здесь будут отображаться все сгенерированные посты. 
              Вы сможете просматривать, редактировать и скачивать их.
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <a href="/generator">
                Создать первый пост
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
