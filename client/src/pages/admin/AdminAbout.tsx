import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface Interest {
  label: string;
  description: string;
}

interface Favorite {
  category: string;
  items: string[];
}

interface AboutConfig {
  hero: {
    image: string;
    title: string;
    paragraphs: string[];
    quote: string;
  };
  interests: Interest[];
  favorites: Favorite[];
}

const defaultConfig: AboutConfig = {
  hero: { image: "", title: "", paragraphs: [], quote: "" },
  interests: [],
  favorites: [],
};

export default function AdminAbout() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.getAboutConfig.useQuery();
  const [config, setConfig] = useState<AboutConfig>(defaultConfig);

  useEffect(() => {
    if (data?.success && data.config) {
      setConfig(data.config as AboutConfig);
    }
  }, [data]);

  const updateMutation = trpc.admin.updateAboutConfig.useMutation({
    onSuccess: () => {
      toast.success("关于页面配置已保存");
      utils.admin.getAboutConfig.invalidate();
    },
    onError: () => toast.error("保存失败"),
  });

  const handleSave = () => {
    updateMutation.mutate(config);
  };

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/upload/images/image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.imagePath) {
        updateHero("image", data.imagePath);
        toast.success("头像已上传");
      } else {
        toast.error(data.error || "上传失败");
      }
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Hero 字段更新
  const updateHero = (field: string, value: string | string[]) => {
    setConfig(prev => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  };

  // 段落操作
  const updateParagraph = (index: number, value: string) => {
    const paragraphs = [...config.hero.paragraphs];
    paragraphs[index] = value;
    updateHero("paragraphs", paragraphs);
  };
  const addParagraph = () => {
    updateHero("paragraphs", [...config.hero.paragraphs, ""]);
  };
  const removeParagraph = (index: number) => {
    updateHero(
      "paragraphs",
      config.hero.paragraphs.filter((_, i) => i !== index)
    );
  };

  // 兴趣操作
  const updateInterest = (
    index: number,
    field: keyof Interest,
    value: string
  ) => {
    const interests = [...config.interests];
    interests[index] = { ...interests[index], [field]: value };
    setConfig(prev => ({ ...prev, interests }));
  };
  const addInterest = () => {
    setConfig(prev => ({
      ...prev,
      interests: [...prev.interests, { label: "", description: "" }],
    }));
  };
  const removeInterest = (index: number) => {
    setConfig(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index),
    }));
  };

  // 收藏操作
  const updateFavoriteCategory = (index: number, value: string) => {
    const favorites = [...config.favorites];
    favorites[index] = { ...favorites[index], category: value };
    setConfig(prev => ({ ...prev, favorites }));
  };
  const updateFavoriteItem = (
    favIndex: number,
    itemIndex: number,
    value: string
  ) => {
    const favorites = [...config.favorites];
    const items = [...favorites[favIndex].items];
    items[itemIndex] = value;
    favorites[favIndex] = { ...favorites[favIndex], items };
    setConfig(prev => ({ ...prev, favorites }));
  };
  const addFavoriteItem = (favIndex: number) => {
    const favorites = [...config.favorites];
    favorites[favIndex] = {
      ...favorites[favIndex],
      items: [...favorites[favIndex].items, ""],
    };
    setConfig(prev => ({ ...prev, favorites }));
  };
  const removeFavoriteItem = (favIndex: number, itemIndex: number) => {
    const favorites = [...config.favorites];
    favorites[favIndex] = {
      ...favorites[favIndex],
      items: favorites[favIndex].items.filter((_, i) => i !== itemIndex),
    };
    setConfig(prev => ({ ...prev, favorites }));
  };
  const addFavorite = () => {
    setConfig(prev => ({
      ...prev,
      favorites: [...prev.favorites, { category: "", items: [] }],
    }));
  };
  const removeFavorite = (index: number) => {
    setConfig(prev => ({
      ...prev,
      favorites: prev.favorites.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        加载中...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          关于页面
        </h1>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="sm"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              保存中...
            </>
          ) : (
            "保存配置"
          )}
        </Button>
      </div>

      <div className="space-y-8">
        {/* Hero 区域 */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Hero 区域</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="hero-title">标题</Label>
              <Input
                id="hero-title"
                value={config.hero.title}
                onChange={e => updateHero("title", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hero-image">头像图片</Label>
              <div className="mt-1 flex items-center gap-3">
                {config.hero.image && (
                  <img
                    src={config.hero.image}
                    alt="头像预览"
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                  />
                )}
                <Input
                  id="hero-image"
                  value={config.hero.image}
                  onChange={e => updateHero("image", e.target.value)}
                  className="flex-1"
                  placeholder="/images/about-portrait.webp"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label>段落内容</Label>
              <div className="space-y-2 mt-1">
                {config.hero.paragraphs.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Textarea
                      value={p}
                      onChange={e => updateParagraph(i, e.target.value)}
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParagraph(i)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addParagraph}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加段落
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="hero-quote">引言</Label>
              <Input
                id="hero-quote"
                value={config.hero.quote}
                onChange={e => updateHero("quote", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* 兴趣爱好 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">兴趣爱好</h2>
            <Button variant="outline" size="sm" onClick={addInterest}>
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
          <div className="space-y-3">
            {config.interests.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Input
                  value={item.label}
                  onChange={e => updateInterest(i, "label", e.target.value)}
                  placeholder="标签"
                  className="w-28 shrink-0"
                />
                <Input
                  value={item.description}
                  onChange={e =>
                    updateInterest(i, "description", e.target.value)
                  }
                  placeholder="描述"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInterest(i)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* 收藏推荐 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">收藏推荐</h2>
            <Button variant="outline" size="sm" onClick={addFavorite}>
              <Plus className="h-4 w-4 mr-1" />
              添加分类
            </Button>
          </div>
          <div className="space-y-6">
            {config.favorites.map((fav, favIdx) => (
              <div key={favIdx} className="border border-border rounded-lg p-4">
                <div className="flex gap-2 items-center mb-3">
                  <Input
                    value={fav.category}
                    onChange={e =>
                      updateFavoriteCategory(favIdx, e.target.value)
                    }
                    placeholder="分类名称"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFavorite(favIdx)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {fav.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={e =>
                          updateFavoriteItem(favIdx, itemIdx, e.target.value)
                        }
                        placeholder="项目"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFavoriteItem(favIdx, itemIdx)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addFavoriteItem(favIdx)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加项目
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
