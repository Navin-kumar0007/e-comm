import Image from "next/image";
import Link from 'next/link';
import { getBlogPosts } from '@/app/actions/blog';

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="container max-w-4xl py-10 md:py-12 pt-28 md:pt-36">
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-3">The Spice Journal</h1>
        <p className="text-xl text-zinc-500">Stories, recipes, and insights from Spicy Nuts.</p>
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
              <span className="text-[#C85B43] font-medium">{post.category}</span>
              <span>&bull;</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2 group-hover:text-[#C85B43] transition-colors">{post.title}</h2>
            <p className="text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
          </div>
        )) : (
          <div className="col-span-2 text-center text-muted-foreground py-12">
            No blog posts published yet. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
}
