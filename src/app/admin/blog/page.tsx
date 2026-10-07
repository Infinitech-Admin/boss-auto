import BlogClient from "./blogclient";

export default function AdminBlogPage() {
  const imageBaseUrl =
    process.env.NEXT_PUBLIC_MEDIA_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.LARAVEL_API_URL ||
    "http://localhost:8000";

  return <BlogClient imageBaseUrl={imageBaseUrl} />;
}
