import BlogEditor from '@/components/blog/BlogEditor'
import CreatorBlogList from '@/components/blog/CreatorBlogList'

export default function CreatorBlogSection() {
  return (
    <div className="space-y-8">
      <BlogEditor />
      <CreatorBlogList />
    </div>
  )
}
