import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, Loader2, CheckCircle } from "lucide-react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  const isValidEmail = email.trim() === "" || emailRegex.test(email.trim());

  const subscribe = trpc.blog.subscribe.useMutation({
    onSuccess: result => {
      if (result.success) {
        setMessage(result.message || "验证邮件已发送，请查收");
        setIsSuccess(true);
        setEmail("");
        setTouched(false);
      } else {
        setMessage(result.error || "订阅失败");
        setIsSuccess(false);
      }
    },
    onError: () => {
      setMessage("订阅失败，请稍后重试");
      setIsSuccess(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setTouched(true);
    if (!email.trim() || !emailRegex.test(email.trim())) return;
    subscribe.mutate({ email: email.trim() });
  };

  return (
    <div>
      <p
        className="text-[#1A1A1A] dark:text-[#F5F5F5] text-sm mb-3"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        订阅新文章推送
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            if (touched) setTouched(false);
          }}
          onBlur={() => setTouched(true)}
          placeholder="your@email.com"
          className={`flex-1 px-3 py-2 text-sm bg-transparent border rounded placeholder-[#C4C4C0] dark:placeholder-[#555] text-[#1A1A1A] dark:text-[#F5F5F5] focus:outline-none transition-colors ${
            touched && !isValidEmail
              ? "border-red-400 dark:border-red-500 focus:border-red-500"
              : "border-[#1A1A1A]/15 dark:border-[#F5F5F5]/15 focus:border-[#1A1A1A]/40 dark:focus:border-[#F5F5F5]/40"
          }`}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          disabled={subscribe.isPending}
        />
        <button
          type="submit"
          disabled={subscribe.isPending || !email.trim() || !isValidEmail}
          className="px-4 py-2 text-sm bg-[#1A1A1A] dark:bg-[#F5F5F5] text-[#F5F5F5] dark:text-[#1A1A1A] rounded hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {subscribe.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Mail className="h-3.5 w-3.5" />
          )}
          订阅
        </button>
      </form>
      {touched && !isValidEmail && (
        <p
          className="text-xs mt-2 text-red-500 dark:text-red-400"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          请输入有效的邮箱地址
        </p>
      )}
      {message && (
        <p
          className={`text-xs mt-2 flex items-center gap-1 ${isSuccess ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {isSuccess && <CheckCircle className="h-3 w-3" />}
          {message}
        </p>
      )}
    </div>
  );
}
