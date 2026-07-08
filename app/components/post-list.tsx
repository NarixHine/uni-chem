"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <div>
      {posts.map((post, index) => (
        <article
          key={post.slug}
          className="reveal group border-b border-[var(--border)] py-10 first:border-t first:pt-12"
          style={{ transitionDelay: `calc(${index} * 80ms)` }}
        >
          <div className="flex items-center gap-3 font-mono text-xs text-muted">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingTime}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag.label} className={`tag tag-${tag.color}`}>
                {tag.label}
              </span>
            ))}
          </div>

          <h2 className="mt-4 font-serif text-2xl leading-[1.15] tracking-tight md:text-3xl">
            <Link
              href={`/blog/${post.slug}`}
              className="decoration-1 underline-offset-4 hover:underline"
            >
              {post.title}
            </Link>
          </h2>

          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            {post.excerpt}
          </p>

          <Link
            href={`/blog/${post.slug}`}
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition-all hover:gap-2"
          >
            Read essay
            <ArrowRight
              style={{ width: 14, height: 14 }}
              weight="bold"
              aria-hidden="true"
            />
          </Link>
        </article>
      ))}
    </div>
  );
}
