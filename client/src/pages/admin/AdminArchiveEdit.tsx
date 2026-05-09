import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Upload, Loader2, X } from "lucide-react";
import { parseTags } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "wouter";
import { getToken } from "@/lib/auth";

export default function AdminArchiveEdit() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/admin/archives/:id");
  const isNew = !params?.id || params.id === "new";
  const editId = isNew ? null : params!.id;

  const utils = trpc.useUtils();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isPastingImage, setIsPastingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const { data: existingData, isLoading: isLoadingExisting } = trpc.admin.getArchive.useQuery(
    { id: editId! },
    { enabled: !!editId }
  );

  useEffect(() => {
    if (existingData?.archive) {
      const a = existingData.archive;
      setTitle(a.title);
      setSubtitle(a.subtitle || "");
      setSlug(a.slug);
      setDate(a.date);
      setCategory(a.category);
      setTags(parseTags(a.tags));
      setExcerpt(a.excerpt);
      setContent(a.content);
    }
  }, [existingData]);

  const createMutation = trpc.admin.createArchive.useMutation({
    onSuccess: result => {
      if (result.success) {
        toast.success("归档创建成功");
        utils.admin.listArchives.invalidate();
        utils.archive.listArchives.invalidate();
        utils.archive.getByYear.invalidate();
        navigate("/admin/archives");
      } else {
        toast.error(result.error || "创建失败");
      }
    },
    onError: () => toast.error("创建失败"),
  });

  const updateMutation = trpc.admin.updateArchive.useMutation({
    onSuccess: result => {
      if (result.success) {
        toast.success("归档已更新");
        utils.admin.listArchives.invalidate();
        utils.archive.listArchives.invalidate();
        utils.archive.getByYear.invalidate();
        navigate("/admin/archives");
      } else {
        toast.error(result.error || "更新失败");
      }
    },
    onError: () => toast.error("更新失败"),
  });

  const parseMutation = trpc.admin.parseMarkdown.useMutation();

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
      setExcerpt(result.excerpt);
      setContent(result.content);

      toast.success("Markdown 解析完成");
    } catch {
      toast.error("解析失败");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 粘贴图片上传
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItem = Array.from(items).find(item => item.type.startsWith("image/"));
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    setIsPastingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const token = getToken();
      const res = await fetch(`/api/upload/archives/image`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (data.success && data.imagePath) {
        const textarea = contentRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const mdImage = `![](${data.imagePath})`;
          const newContent = content.slice(0, start) + mdImage + content.slice(end);
          setContent(newContent);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + mdImage.length;
            textarea.focus();
          }, 0);
        }
        toast.success("图片已上传");
      } else {
        toast.error("图片上传失败");
      }
    } catch {
      toast.error("图片上传失败");
    } finally {
      setIsPastingImage(false);
    }
  };

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

  const handleSubmit = async () => {
    if (isSaving) return;
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
        <Link href="/admin/archives">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
        </Link>
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          {isNew ? "新建归档" : "编辑归档"}
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
        <div className="space-y-2">
          <Label htmlFor="title">标题 *</Label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="归档标题"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">副标题</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            placeholder="可选"
          />
        </div>

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

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="content">正文 (Markdown) *</Label>
          <Textarea
            ref={contentRef}
            id="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="在此输入 Markdown 内容...（可直接粘贴图片）"
            rows={20}
            className="font-mono text-sm"
          />
          {isPastingImage && (
            <p className="text-xs text-muted-foreground animate-pulse">
              正在上传图片...
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : isNew ? (
              "创建归档"
            ) : (
              "保存修改"
            )}
          </Button>
          <Link href="/admin/archives">
            <Button variant="outline">取消</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
