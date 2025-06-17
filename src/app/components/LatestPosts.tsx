interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
}

interface LatestPostsProps {
  title: string;
  posts: Post[];
}

export default function LatestPosts({ title, posts }: LatestPostsProps) {
  return (
    <div className='latest_list'>
      <h3>{title}</h3>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <a href={`/post/${post.id}`}>
              {post.title}
              <span className='latest_date'>{post.date}</span>
            </a>
          </li>
        ))}
        {posts.length === 0 && (
          <li style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
            등록된 게시물이 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}
