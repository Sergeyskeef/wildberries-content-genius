import { useState } from "react";
import { Sparkles, Wand2, Image, FileText, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Generator() {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("advice");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    // Placeholder for actual implementation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI-генератор постов</h1>
        <p className="text-muted-foreground mt-1">
          Создавайте Instagram-карусели с помощью искусственного интеллекта
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Настройки генерации
              </CardTitle>
              <CardDescription>
                Опишите тему или выберите контент из базы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Тип контента</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advice">Совет для селлеров</SelectItem>
                    <SelectItem value="case">Кейс / История успеха</SelectItem>
                    <SelectItem value="trend">Тренд / Новость</SelectItem>
                    <SelectItem value="motivation">Мотивация</SelectItem>
                    <SelectItem value="education">Обучающий контент</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Тема или идея поста</Label>
                <Textarea
                  id="topic"
                  placeholder="Например: Как выбрать нишу для начала работы на Wildberries в 2024 году"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full gradient-primary text-primary-foreground"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Сгенерировать пост
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Или выберите из базы</CardTitle>
              <CardDescription>
                Используйте собранный вирусный контент
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  База контента пуста
                </p>
                <Button variant="link" className="mt-2" asChild>
                  <a href="/sources">Добавить источники</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Результат генерации</CardTitle>
              <CardDescription>
                Готовый пост для Instagram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="text" className="space-y-4">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="text" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Текст
                  </TabsTrigger>
                  <TabsTrigger value="visuals" className="gap-2">
                    <Image className="h-4 w-4" />
                    Визуалы
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text">
                  <div className="min-h-[300px] rounded-lg border border-dashed border-border flex items-center justify-center">
                    <div className="text-center p-6">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Здесь появится сгенерированный текст поста
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="visuals">
                  <div className="min-h-[300px] rounded-lg border border-dashed border-border flex items-center justify-center">
                    <div className="text-center p-6">
                      <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Здесь появятся сгенерированные слайды карусели
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" disabled>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Перегенерировать
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Скачать
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
