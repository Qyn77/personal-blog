import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminArticleEdit() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/admin/articles/:id");
  const isNew = !params?.id || params.id === "new";
  const editId = isNew ? null : params!.id;

  const utils = trpc.useUtils();

  // 表单状态
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featured, setFeatured] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 编辑模式：加载现有文章
  const { data: existingData, isLoading: isLoadingExisting } = trpc.admin.getArticle.useQuery(
    { id: editId! },
    { enabled: !!editId }
  );

  useEffect(() => {
    if (existingData?.article) {
      const a = existingData.article;
      setTitle(a.title);
      setSubtitle(a.subtitle || "");
      setSlug(a.slug);
      setDate(a.date);
      setCategory(a.category);
      setTags(typeof a.tags === "string" ? JSON.parse(a.tags) : a.tags);
      setFeatured(a.featured === 1);
      setExcerpt(a.excerpt);
      setContent(a.content);
      setCoverImage(a.coverImage || "");
    }
  }, [existingData]);

  // 创建/更新 mutation
  const createMutation = trpc.admin.createArticle.useMutation({
    onSuccess: result => {
      if (result.success) {
        toast.success("文章创建成功");
        utils.admin.listArticles.invalidate();
        utils.blog.listArticles.invalidate();
        navigate("/admin/articles");
      } else {
        toast.error(result.error || "创建失败");
      }
    },
    onError: () => toast.error("创建失败"),
  });

  const updateMutation = trpc.admin.updateArticle.useMutation({
    onSuccess: result => {
      if (result.success) {
        toast.success("文章已更新");
        utils.admin.listArticles.invalidate();
        utils.blog.listArticles.invalidate();
        navigate("/admin/articles");
      } else {
        toast.error(result.error || "更新失败");
      }
    },
    onError: () => toast.error("更新失败"),
  });

  const parseMutation = trpc.admin.parseMarkdown.useMutation();

  // 处理 .md 文件上传解析
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const text = await file.text();
      const result = await parseMutation.mutateAsync({ content: text });

      setTitle(result.title);
      setSubtitle(result.subtitle || "");
      setSlug(result.slug);
      setDate(result.date);
      setCategory(result.category);
      setTags(result.tags);
      setFeatured(result.featured);
      setExcerpt(result.excerpt);
      setContent(result.content);
      if (result.coverImage) setCoverImage(result.coverImage);

      toast.success("Markdown 解析完成");
    } catch {
      toast.error("解析失败");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 处理封面图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("coverImage", file);

      const res = await fetch("/api/upload/books", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success && data.coverImagePath) {
        setCoverImage(data.coverImagePath);
        toast.success("封面图片上传成功");
      } else {
        toast.error("图片上传失败");
      }
    } catch {
      toast.error("图片上传失败");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // 标签操作
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("请输入标题");
      return;
    }
    if (!content.trim()) {
      toast.error("请输入内容");
      return;
    }

    const formData = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      content,
      date,
      tags,
      category: category.trim() || "uncategorized",
      featured,
      coverImage: coverImage || undefined,
      slug: slug.trim() || undefined,
    };

    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate({ id: editId!, ...formData });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (editId && isLoadingExisting) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        加载中...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/articles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
        </Link>
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          {isNew ? "新建文章" : "编辑文章"}
        </h1>
      </div>

      {isNew && (
        <Tabs defaultValue="upload" className="mb-6">
          <TabsList>
            <TabsTrigger value="upload">上传 .md 文件</TabsTrigger>
            <TabsTrigger value="manual">手动编辑</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                上传 Markdown 文件，自动解析 frontmatter 填充表单
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,text/markdown"
                onChange={handleFileUpload}
                className="hidden"
                id="md-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    解析中...
                  </>
                ) : (
                  "选择 .md 文件"
                )}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="manual" />
        </Tabs>
      )}

      <div className="space-y-5">
        {/* 标题 */}
        <div className="space-y-2">
          <Label htmlFor="title">标题 *</Label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="文章标题"
          />
        </div>

        {/* 副标题 */}
        <div className="space-y-2">
          <Label htmlFor="subtitle">副标题</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            placeholder="可选"
          />
        </div>

        {/* Slug + 日期 + 分类 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="auto-generated"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">日期</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <Input
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="uncategorized"
            />
          </div>
        </div>

        {/* 标签 */}
        <div className="space-y-2">
          <Label>标签</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="输入标签后按 Enter"
              className="flex-1"
            />
            <Button variant="outline" onClick={addTag} type="button">
              添加
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 置顶 */}
        <div className="flex items-center gap-3">
          <Switch checked={featured} onCheckedChange={setFeatured} id="featured" />
          <Label htmlFor="featured">置顶文章</Label>
        </div>

        {/* 摘要 */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">摘要</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            placeholder="留空将自动从正文生成"
            rows={3}
          />
        </div>

        {/* 封面图片 */}
        <div className="space-y-2">
          <Label>封面图片</Label>
          <div className="flex items-center gap-3">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  上传中...
                </>
              ) : (
                "上传图片"
              )}
            </Button>
            {coverImage && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground truncate max-w-xs">
                  {coverImage}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoverImage("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* 正文 */}
        <div className="space-y-2">
          <Label htmlFor="content">正文 (Markdown) *</Label>
          <Textarea
            id="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="在此输入 Markdown 内容..."
            rows={20}
            className="font-mono text-sm"
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : isNew ? (
              "创建文章"
            ) : (
              "保存修改"
            )}
          </Button>
          <Link href="/admin/articles">
            <Button variant="outline">取消</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
