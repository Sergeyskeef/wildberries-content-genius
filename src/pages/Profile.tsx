import { useState } from "react";
import { User, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Profile() {
  const [name, setName] = useState("Наташа");
  const [description, setDescription] = useState("Эксперт по Wildberries, помогаю селлерам зарабатывать на маркетплейсе");
  const [tone, setTone] = useState("Дружелюбный, экспертный, мотивирующий");
  const [topics, setTopics] = useState(["Wildberries", "Селлеры", "Маркетплейс", "Бизнес"]);
  const [newTopic, setNewTopic] = useState("");
  const [forbiddenWords, setForbiddenWords] = useState("");

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };

  const handleSave = () => {
    toast.success("Профиль сохранён");
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Профиль эксперта</h1>
          <p className="text-muted-foreground mt-1">
            Настройте голос и стиль для генерации контента
          </p>
        </div>
        <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
          <Save className="mr-2 h-4 w-4" />
          Сохранить
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Основная информация
            </CardTitle>
            <CardDescription>
              Базовые данные об эксперте
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя эксперта</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наташа"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание / Био</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите эксперта..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Тон голоса</Label>
              <Textarea
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Какой стиль общения?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Ключевые темы</CardTitle>
            <CardDescription>
              Темы, о которых говорит эксперт
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="gap-1 pr-1">
                  {topic}
                  <button
                    onClick={() => handleRemoveTopic(topic)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Новая тема"
                onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
              />
              <Button variant="outline" onClick={handleAddTopic}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Forbidden Words */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Запрещённые слова и фразы</CardTitle>
            <CardDescription>
              Слова, которые не должны использоваться в генерации (через запятую)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={forbiddenWords}
              onChange={(e) => setForbiddenWords(e.target.value)}
              placeholder="Например: гарантированный доход, без вложений, быстрые деньги"
              rows={3}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
