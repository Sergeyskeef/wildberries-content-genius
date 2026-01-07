import { useState, useEffect } from "react";
import { Sparkles, Wand2, RefreshCw, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCarousels, getCarouselDownloadUrl } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Carousel = {
  id: number;
  plan_id: number;
  status: string;
  created_at: string;
  plan?: {
    title: string;
  };
};

export default function Generator() {
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCarousels();
  }, []);

  const loadCarousels = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCarousels();
      setCarousels(data);
    } catch (e) {
      console.error("Failed to load carousels", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const res = await getCarouselDownloadUrl(id);
      if (res.download_url) {
        window.open(res.download_url, "_blank");
      } else {
        toast.error("Ошибка получения ссылки");
      }
    } catch (e) {
      toast.error("Ошибка сети");
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Завод Готового Контента</h1>
        <p className="text-muted-foreground mt-1">
          Здесь появляются результаты работы вашего контент-завода
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Готовые карусели
              </CardTitle>
              <CardDescription>
                ZIP-архивы со слайдами и метаданными, готовые к публикации
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadCarousels}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Обновить
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : carousels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Пока ничего не готово</h3>
                <p className="text-muted-foreground max-w-sm">
                  Одобрите идею в разделе "База контента", и она появится здесь через пару минут.
                </p>
                <Button variant="outline" className="mt-6" asChild>
                  <a href="/content">Перейти к базе</a>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carousels.map((c) => (
                  <div key={c.id} className="p-4 rounded-lg border bg-card flex flex-col justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-lg line-clamp-1">{c.plan?.title || "Без названия"}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Создано: {format(new Date(c.created_at), "d MMMM, HH:mm", { locale: ru })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 gradient-primary" onClick={() => handleDownload(c.id)}>
                        <Download className="h-4 w-4 mr-2" /> Скачать ZIP
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
