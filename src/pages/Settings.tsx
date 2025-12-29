import { Settings as SettingsIcon, Key, Bell, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Настройки</h1>
        <p className="text-muted-foreground mt-1">
          Управление приложением и интеграциями
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              API-ключи
            </CardTitle>
            <CardDescription>
              Ключи для подключения к внешним сервисам
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                AI-генерация работает автоматически через Lovable AI.
                Дополнительные ключи не требуются.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Уведомления
            </CardTitle>
            <CardDescription>
              Настройки оповещений
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Новый контент</Label>
                <p className="text-sm text-muted-foreground">
                  Уведомлять о новом вирусном контенте
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Генерация завершена</Label>
                <p className="text-sm text-muted-foreground">
                  Уведомлять о готовности постов
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Внешний вид
            </CardTitle>
            <CardDescription>
              Настройки интерфейса
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Тёмная тема</Label>
                <p className="text-sm text-muted-foreground">
                  Использовать тёмное оформление
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
