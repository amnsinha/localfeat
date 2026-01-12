import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Clock, Eye, Tag, ArrowLeft, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BlogPost } from "@shared/schema";

export default function Blog() {
  const { data: blogPosts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
  });

  const { data: featuredPosts, isLoading: featuredLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts/featured"],
  });

  if (isLoading || featuredLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to LocalFeat
              </Button>
            </Link>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>Community Blog</span>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              LocalFeat Blog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover trending topics, local insights, and community stories that bring neighborhoods together
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Featured Posts Section */}
        {featuredPosts && featuredPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Tag className="h-6 w-6 mr-2 text-blue-600" />
              Featured Stories
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.slice(0, 3).map((post) => (
                <Card key={post.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                  <Link href={`/blog/${post.slug}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {post.viewCount} views
                        </div>
                      </div>
                      <CardTitle className="text-lg line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-3">
                        {post.excerpt}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
            <Separator className="mt-8" />
          </section>
        )}

        {/* All Posts Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-green-600" />
            Latest Stories
          </h2>
          
          {!blogPosts || blogPosts.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 text-center py-12">
              <CardContent>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Coming Soon!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our automated content generation is setting up fresh stories about trending topics in your local community.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {blogPosts.map((post) => (
                <Card key={post.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="p-6 cursor-pointer">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(post.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                {post.viewCount} views
                              </div>
                            </div>
                            {post.featured && (
                              <Badge variant="default" className="bg-blue-500">
                                Featured
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {post.title}
                          </h3>
                          
                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
                            {post.tags.slice(0, 5).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Load More */}
        {blogPosts && blogPosts.length >= 10 && (
          <div className="text-center mt-8">
            <Button variant="outline" className="px-8">
              Load More Stories
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}