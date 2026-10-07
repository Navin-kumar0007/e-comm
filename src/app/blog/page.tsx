import Image from "next/image";
import Link from 'next/link';
import { getBlogPosts } from '@/app/actions/blog';
import { PageHero } from "@/components/storefront/royal/page-hero";

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <PageHero eyebrow={"Journal"} title={"The Spice Journal"} subtitle={"Stories, recipes, and insights from Spicy Nuts."} crumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-10">
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {posts.length > 0 ? posts.map((post) => (
          <div key={post.id} className="group cursor-pointer">
            <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 rounded-2xl mb-4 overflow-hidden relative">
              {post.image ? (
                <Image width={800} height={800} unoptimized={false} src={post.image} alt={post.title} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-500 mb-2">
              <span className="text-primary font-medium">{post.category}</span>
              <span>&bull;</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
            <p className="text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
          </div>
        )) : (
          <div className="col-span-2 text-center text-muted-foreground py-12">
            No blog posts published yet. Check back soon!
          </div>
        )}
      </div>
    </div>
    </>
  );
}
