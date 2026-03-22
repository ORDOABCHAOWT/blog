import HomeExperience from '@/components/HomeExperience';
import { getPostSummaries } from '@/lib/posts';

export default function Home() {
  const posts = getPostSummaries();

  return <HomeExperience posts={posts} />;
}
