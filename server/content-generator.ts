import type { InsertBlogPost } from "@shared/schema";

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class ContentGenerator {
  private apiKey: string;
  private baseUrl = "https://api.perplexity.ai/chat/completions";

  constructor() {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY environment variable is required");
    }
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  private async callPerplexityAPI(prompt: string): Promise<string> {
    console.log("🔍 Making Perplexity API call...");
    
    const requestBody = {
      model: "sonar",
      messages: [
        {
          role: "system",
          content: "You are a content writer for LocalFeat, a hyperlocal social platform. Write engaging, SEO-friendly blog posts that connect trending topics to local community engagement. Always include practical local applications and community benefits."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9,
      return_related_questions: false,
      search_recency_filter: "week",
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 0.1
    };

    console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:", errorText);
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: PerplexityResponse = await response.json();
    console.log("✅ API Response received:", data.choices?.[0]?.message?.content?.substring(0, 200) + "...");
    return data.choices[0]?.message?.content || "";
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  }

  private extractExcerpt(content: string): string {
    // Remove markdown and HTML, get first 2 sentences
    const cleanContent = content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/<[^>]*>/g, '')
      .trim();
    
    const sentences = cleanContent.split(/[.!?]+/);
    return sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '...' : '');
  }

  private generateMetaDescription(title: string, excerpt: string): string {
    return `${excerpt.substring(0, 140)}... | LocalFeat Blog`;
  }

  private extractTags(content: string): string[] {
    const commonTags = ['local community', 'social media', 'technology', 'lifestyle', 'trends'];
    const contentLower = content.toLowerCase();
    
    const foundTags = commonTags.filter(tag => 
      contentLower.includes(tag.toLowerCase())
    );

    // Add some topic-specific tags based on content
    const topicTags = [];
    if (contentLower.includes('business') || contentLower.includes('entrepreneur')) {
      topicTags.push('local business');
    }
    if (contentLower.includes('event') || contentLower.includes('festival')) {
      topicTags.push('community events');
    }
    if (contentLower.includes('food') || contentLower.includes('restaurant')) {
      topicTags.push('local dining');
    }
    if (contentLower.includes('tech') || contentLower.includes('digital')) {
      topicTags.push('technology');
    }

    return Array.from(new Set([...foundTags, ...topicTags])).slice(0, 5);
  }

  async generateTrendingTopics(): Promise<string[]> {
    const topicsPrompt = `List 10 current trending topics and news that would be relevant for local communities in 2024. Focus on topics that can be applied to local businesses, community events, lifestyle trends, technology adoption, and social movements. Format as a simple numbered list.`;
    
    const response = await this.callPerplexityAPI(topicsPrompt);
    
    // Parse the response to extract topics
    const topics = response
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(topic => topic.length > 0)
      .slice(0, 10);

    return topics.length > 0 ? topics : [
      "AI and Local Business Automation",
      "Community-Driven Sustainability Initiatives",
      "Hyperlocal Social Commerce Trends",
      "Digital Nomads and Small Town Revival",
      "Local Food Scene and Social Media"
    ];
  }

  async generateBlogPost(topic: string): Promise<InsertBlogPost> {
    const contentPrompt = `Write a comprehensive blog post about "${topic}" specifically for LocalFeat users. 

Requirements:
- Focus on how this topic impacts local communities and social connections
- Include practical applications for LocalFeat users
- Make it SEO-friendly with natural keyword usage
- Structure with clear headings and subheadings
- Include actionable advice for local community engagement
- Write in an engaging, accessible tone
- Target length: 800-1200 words
- Include specific examples of how local businesses or community members can benefit

Format the response as a complete blog post with markdown formatting.`;

    const content = await this.callPerplexityAPI(contentPrompt);
    
    // Generate title from the first heading or create one
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : `${topic}: A LocalFeat Community Guide`;
    
    const slug = this.createSlug(title);
    const excerpt = this.extractExcerpt(content);
    const tags = this.extractTags(content);
    const metaTitle = `${title} | LocalFeat Blog`;
    const metaDescription = this.generateMetaDescription(title, excerpt);

    return {
      title,
      slug,
      content,
      excerpt,
      tags,
      metaTitle,
      metaDescription,
      featured: Math.random() < 0.3, // 30% chance of being featured
      published: true,
    };
  }

  async generateDailyContent(): Promise<InsertBlogPost[]> {
    try {
      console.log('🤖 Generating trending topics...');
      const topics = await this.generateTrendingTopics();
      
      console.log('📝 Generating blog posts...');
      // Generate 1-2 posts per day
      const selectedTopics = topics.slice(0, Math.random() < 0.7 ? 1 : 2);
      
      const blogPosts = await Promise.all(
        selectedTopics.map(topic => this.generateBlogPost(topic))
      );

      console.log(`✅ Generated ${blogPosts.length} blog post(s)`);
      return blogPosts;
    } catch (error) {
      console.error('❌ Error generating daily content:', error);
      throw error;
    }
  }
}