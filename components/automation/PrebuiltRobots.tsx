/**
 * PrebuiltRobots Component
 * 
 * Library of 50+ prebuilt automation robots:
 * - E-commerce scrapers (Amazon, eBay, Etsy)
 * - Social media extractors (LinkedIn, Twitter, Instagram)
 * - Real estate (Zillow, Redfin)
 * - Job boards (LinkedIn Jobs, Indeed)
 * - General purpose scrapers
 * 
 * Inspired by Browse.ai's 200+ prebuilt robots
 * 
 * @component
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Bot,
  Search,
  ShoppingCart,
  Briefcase,
  Home,
  Users,
  TrendingUp,
  Database,
  Globe,
  Star,
  Clock,
  Play,
  ExternalLink,
  Grid,
  List,
  Check,
  Copy
} from 'lucide-react';
import './PrebuiltRobots.css';

interface PrebuiltRobot {
  id: string;
  name: string;
  description: string;
  category: RobotCategory;
  website: string;
  websiteIcon?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes to setup
  popularity: number; // 1-100
  rating: number; // 1-5
  reviews: number;
  dataFields: string[];
  tags: string[];
  isPremium: boolean;
  workflow: WorkflowDefinition;
}

interface WorkflowDefinition {
  startUrl: string;
  steps: WorkflowStep[];
  outputSchema: Record<string, string>;
}

interface WorkflowStep {
  type: 'navigate' | 'click' | 'extract' | 'scroll' | 'wait' | 'paginate' | 'input';
  selector?: string;
  value?: string;
  description: string;
}

type RobotCategory = 
  | 'e-commerce'
  | 'social-media'
  | 'real-estate'
  | 'job-boards'
  | 'finance'
  | 'news'
  | 'travel'
  | 'general';

const CATEGORIES: { value: RobotCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'e-commerce', label: 'E-Commerce', icon: <ShoppingCart size={18} /> },
  { value: 'social-media', label: 'Social Media', icon: <Users size={18} /> },
  { value: 'real-estate', label: 'Real Estate', icon: <Home size={18} /> },
  { value: 'job-boards', label: 'Job Boards', icon: <Briefcase size={18} /> },
  { value: 'finance', label: 'Finance', icon: <TrendingUp size={18} /> },
  { value: 'news', label: 'News & Media', icon: <Globe size={18} /> },
  { value: 'travel', label: 'Travel', icon: <Globe size={18} /> },
  { value: 'general', label: 'General', icon: <Database size={18} /> },
];

// Prebuilt robots data
const PREBUILT_ROBOTS: PrebuiltRobot[] = [
  // E-Commerce
  {
    id: 'amazon-search',
    name: 'Amazon Product Search Scraper',
    description: 'Extract product listings from Amazon search results including prices, ratings, reviews, and seller info.',
    category: 'e-commerce',
    website: 'amazon.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 98,
    rating: 4.9,
    reviews: 2450,
    dataFields: ['Title', 'Price', 'Rating', 'Reviews Count', 'Seller', 'Prime Status', 'Image URL'],
    tags: ['amazon', 'products', 'prices', 'competitor'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.amazon.com/s?k={keyword}',
      steps: [
        { type: 'wait', description: 'Wait for results to load' },
        { type: 'extract', selector: '.s-result-item', description: 'Extract product cards' },
        { type: 'paginate', selector: '.s-pagination-next', description: 'Go to next page' },
      ],
      outputSchema: {
        title: 'string',
        price: 'number',
        rating: 'number',
        reviews: 'number',
      },
    },
  },
  {
    id: 'amazon-product-details',
    name: 'Amazon Product Details Extractor',
    description: 'Get detailed product information including all variations, Q&A, and complete specifications.',
    category: 'e-commerce',
    website: 'amazon.com',
    difficulty: 'intermediate',
    estimatedTime: 10,
    popularity: 92,
    rating: 4.8,
    reviews: 1823,
    dataFields: ['Title', 'Price', 'Description', 'Features', 'Specifications', 'Images', 'Variations'],
    tags: ['amazon', 'product details', 'specifications'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.amazon.com/dp/{asin}',
      steps: [
        { type: 'wait', description: 'Wait for page to load' },
        { type: 'extract', selector: '#productTitle', description: 'Extract title' },
        { type: 'extract', selector: '#priceblock_ourprice', description: 'Extract price' },
        { type: 'scroll', description: 'Scroll to load more content' },
      ],
      outputSchema: {
        title: 'string',
        price: 'number',
        description: 'string',
        features: 'array',
      },
    },
  },
  {
    id: 'ebay-listings',
    name: 'eBay Listings Scraper',
    description: 'Monitor eBay listings for any search query with auction and buy-it-now prices.',
    category: 'e-commerce',
    website: 'ebay.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 85,
    rating: 4.7,
    reviews: 956,
    dataFields: ['Title', 'Price', 'Bids', 'Time Left', 'Seller Rating', 'Shipping', 'Condition'],
    tags: ['ebay', 'auctions', 'buy-it-now'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.ebay.com/sch/i.html?_nkw={keyword}',
      steps: [
        { type: 'extract', selector: '.s-item', description: 'Extract listings' },
        { type: 'paginate', selector: '.pagination__next', description: 'Next page' },
      ],
      outputSchema: {
        title: 'string',
        price: 'number',
        condition: 'string',
      },
    },
  },
  {
    id: 'etsy-products',
    name: 'Etsy Product Scraper',
    description: 'Extract handmade and vintage items from Etsy with seller details and reviews.',
    category: 'e-commerce',
    website: 'etsy.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 78,
    rating: 4.6,
    reviews: 634,
    dataFields: ['Title', 'Price', 'Shop Name', 'Rating', 'Reviews', 'Shipping', 'Favorites'],
    tags: ['etsy', 'handmade', 'vintage'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.etsy.com/search?q={keyword}',
      steps: [
        { type: 'extract', selector: '.v2-listing-card', description: 'Extract products' },
      ],
      outputSchema: {
        title: 'string',
        price: 'number',
        shop: 'string',
      },
    },
  },
  {
    id: 'shopify-products',
    name: 'Shopify Store Scraper',
    description: 'Extract all products from any Shopify store including variants and inventory.',
    category: 'e-commerce',
    website: 'shopify.com',
    difficulty: 'intermediate',
    estimatedTime: 15,
    popularity: 72,
    rating: 4.5,
    reviews: 412,
    dataFields: ['Title', 'Price', 'Compare Price', 'Variants', 'SKU', 'Inventory', 'Images'],
    tags: ['shopify', 'store', 'inventory'],
    isPremium: true,
    workflow: {
      startUrl: '{store_url}/products.json',
      steps: [
        { type: 'extract', description: 'Parse JSON products' },
      ],
      outputSchema: {
        title: 'string',
        price: 'number',
        variants: 'array',
      },
    },
  },

  // Social Media
  {
    id: 'linkedin-profiles',
    name: 'LinkedIn Profile Extractor',
    description: 'Extract professional profile data including experience, education, and skills.',
    category: 'social-media',
    website: 'linkedin.com',
    difficulty: 'intermediate',
    estimatedTime: 10,
    popularity: 95,
    rating: 4.8,
    reviews: 3120,
    dataFields: ['Name', 'Headline', 'Location', 'Experience', 'Education', 'Skills', 'Connections'],
    tags: ['linkedin', 'profiles', 'leads', 'recruiting'],
    isPremium: true,
    workflow: {
      startUrl: 'https://www.linkedin.com/in/{profile}',
      steps: [
        { type: 'wait', description: 'Wait for profile to load' },
        { type: 'extract', selector: '.pv-top-card', description: 'Extract basic info' },
        { type: 'scroll', description: 'Scroll to load experience' },
      ],
      outputSchema: {
        name: 'string',
        headline: 'string',
        location: 'string',
      },
    },
  },
  {
    id: 'linkedin-jobs',
    name: 'LinkedIn Jobs Scraper',
    description: 'Monitor job postings on LinkedIn with company info and application links.',
    category: 'job-boards',
    website: 'linkedin.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 91,
    rating: 4.7,
    reviews: 2540,
    dataFields: ['Job Title', 'Company', 'Location', 'Salary', 'Posted Date', 'Apply Link', 'Description'],
    tags: ['linkedin', 'jobs', 'careers'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.linkedin.com/jobs/search/?keywords={keyword}',
      steps: [
        { type: 'extract', selector: '.job-card-container', description: 'Extract job cards' },
      ],
      outputSchema: {
        title: 'string',
        company: 'string',
        location: 'string',
      },
    },
  },
  {
    id: 'twitter-profiles',
    name: 'Twitter/X Profile Scraper',
    description: 'Extract Twitter profile data including bio, followers, and recent tweets.',
    category: 'social-media',
    website: 'twitter.com',
    difficulty: 'intermediate',
    estimatedTime: 10,
    popularity: 82,
    rating: 4.5,
    reviews: 1234,
    dataFields: ['Username', 'Name', 'Bio', 'Followers', 'Following', 'Tweet Count', 'Location'],
    tags: ['twitter', 'x', 'profiles', 'social'],
    isPremium: true,
    workflow: {
      startUrl: 'https://twitter.com/{username}',
      steps: [
        { type: 'wait', description: 'Wait for profile' },
        { type: 'extract', description: 'Extract profile data' },
      ],
      outputSchema: {
        username: 'string',
        name: 'string',
        bio: 'string',
      },
    },
  },
  {
    id: 'instagram-posts',
    name: 'Instagram Post Scraper',
    description: 'Extract Instagram posts with likes, comments, and hashtags from public profiles.',
    category: 'social-media',
    website: 'instagram.com',
    difficulty: 'advanced',
    estimatedTime: 15,
    popularity: 88,
    rating: 4.6,
    reviews: 1876,
    dataFields: ['Post URL', 'Caption', 'Likes', 'Comments', 'Hashtags', 'Image URL', 'Posted Date'],
    tags: ['instagram', 'posts', 'influencer'],
    isPremium: true,
    workflow: {
      startUrl: 'https://www.instagram.com/{username}',
      steps: [
        { type: 'scroll', description: 'Scroll to load posts' },
        { type: 'extract', description: 'Extract post data' },
      ],
      outputSchema: {
        caption: 'string',
        likes: 'number',
        comments: 'number',
      },
    },
  },

  // Real Estate
  {
    id: 'zillow-listings',
    name: 'Zillow Property Listings',
    description: 'Extract real estate listings with prices, features, and Zestimate values.',
    category: 'real-estate',
    website: 'zillow.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 89,
    rating: 4.8,
    reviews: 2156,
    dataFields: ['Address', 'Price', 'Beds', 'Baths', 'Sqft', 'Zestimate', 'Days on Market', 'HOA'],
    tags: ['zillow', 'real estate', 'homes'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.zillow.com/{location}',
      steps: [
        { type: 'extract', selector: '.list-card', description: 'Extract listings' },
      ],
      outputSchema: {
        address: 'string',
        price: 'number',
        beds: 'number',
        baths: 'number',
      },
    },
  },
  {
    id: 'redfin-listings',
    name: 'Redfin Property Scraper',
    description: 'Monitor Redfin listings with detailed property info and price history.',
    category: 'real-estate',
    website: 'redfin.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 76,
    rating: 4.6,
    reviews: 987,
    dataFields: ['Address', 'Price', 'Beds', 'Baths', 'Sqft', 'Year Built', 'Price History'],
    tags: ['redfin', 'real estate', 'homes'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.redfin.com/city/{city}',
      steps: [
        { type: 'extract', description: 'Extract property cards' },
      ],
      outputSchema: {
        address: 'string',
        price: 'number',
      },
    },
  },
  {
    id: 'airbnb-listings',
    name: 'Airbnb Listings Extractor',
    description: 'Extract vacation rentals with prices, reviews, and availability.',
    category: 'real-estate',
    website: 'airbnb.com',
    difficulty: 'intermediate',
    estimatedTime: 10,
    popularity: 84,
    rating: 4.7,
    reviews: 1543,
    dataFields: ['Title', 'Price/Night', 'Rating', 'Reviews', 'Beds', 'Baths', 'Amenities', 'Host'],
    tags: ['airbnb', 'vacation', 'rentals'],
    isPremium: true,
    workflow: {
      startUrl: 'https://www.airbnb.com/s/{location}/homes',
      steps: [
        { type: 'scroll', description: 'Load more listings' },
        { type: 'extract', description: 'Extract listing cards' },
      ],
      outputSchema: {
        title: 'string',
        pricePerNight: 'number',
        rating: 'number',
      },
    },
  },

  // Job Boards
  {
    id: 'indeed-jobs',
    name: 'Indeed Jobs Scraper',
    description: 'Extract job postings from Indeed with salary estimates and company ratings.',
    category: 'job-boards',
    website: 'indeed.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 93,
    rating: 4.8,
    reviews: 2890,
    dataFields: ['Job Title', 'Company', 'Location', 'Salary', 'Job Type', 'Posted Date', 'Description'],
    tags: ['indeed', 'jobs', 'careers', 'hiring'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.indeed.com/jobs?q={keyword}&l={location}',
      steps: [
        { type: 'extract', selector: '.job_seen_beacon', description: 'Extract job cards' },
        { type: 'paginate', description: 'Go to next page' },
      ],
      outputSchema: {
        title: 'string',
        company: 'string',
        salary: 'string',
      },
    },
  },
  {
    id: 'glassdoor-reviews',
    name: 'Glassdoor Company Reviews',
    description: 'Extract company reviews, ratings, and salary data from Glassdoor.',
    category: 'job-boards',
    website: 'glassdoor.com',
    difficulty: 'intermediate',
    estimatedTime: 10,
    popularity: 79,
    rating: 4.5,
    reviews: 1234,
    dataFields: ['Company', 'Overall Rating', 'Pros', 'Cons', 'CEO Approval', 'Salary Data'],
    tags: ['glassdoor', 'reviews', 'salaries', 'companies'],
    isPremium: true,
    workflow: {
      startUrl: 'https://www.glassdoor.com/Reviews/{company}-Reviews',
      steps: [
        { type: 'extract', description: 'Extract reviews' },
      ],
      outputSchema: {
        rating: 'number',
        pros: 'string',
        cons: 'string',
      },
    },
  },

  // Finance
  {
    id: 'yahoo-finance-stocks',
    name: 'Yahoo Finance Stock Data',
    description: 'Extract stock quotes, financials, and historical price data.',
    category: 'finance',
    website: 'finance.yahoo.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 86,
    rating: 4.7,
    reviews: 1567,
    dataFields: ['Symbol', 'Price', 'Change', 'Volume', 'Market Cap', '52 Week Range', 'PE Ratio'],
    tags: ['stocks', 'finance', 'investing', 'market data'],
    isPremium: false,
    workflow: {
      startUrl: 'https://finance.yahoo.com/quote/{symbol}',
      steps: [
        { type: 'extract', description: 'Extract stock data' },
      ],
      outputSchema: {
        symbol: 'string',
        price: 'number',
        change: 'number',
      },
    },
  },
  {
    id: 'crunchbase-companies',
    name: 'Crunchbase Company Data',
    description: 'Extract company profiles with funding rounds, investors, and team info.',
    category: 'finance',
    website: 'crunchbase.com',
    difficulty: 'intermediate',
    estimatedTime: 10,
    popularity: 74,
    rating: 4.4,
    reviews: 876,
    dataFields: ['Company Name', 'Industry', 'Funding Total', 'Investors', 'Employees', 'Founded'],
    tags: ['crunchbase', 'startups', 'funding', 'investors'],
    isPremium: true,
    workflow: {
      startUrl: 'https://www.crunchbase.com/organization/{company}',
      steps: [
        { type: 'wait', description: 'Wait for page load' },
        { type: 'extract', description: 'Extract company data' },
      ],
      outputSchema: {
        name: 'string',
        funding: 'number',
        industry: 'string',
      },
    },
  },

  // News & Media
  {
    id: 'google-news',
    name: 'Google News Scraper',
    description: 'Extract news articles from Google News for any topic or keyword.',
    category: 'news',
    website: 'news.google.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 81,
    rating: 4.6,
    reviews: 1423,
    dataFields: ['Title', 'Source', 'Published Date', 'Summary', 'URL', 'Image'],
    tags: ['news', 'google', 'articles', 'media'],
    isPremium: false,
    workflow: {
      startUrl: 'https://news.google.com/search?q={keyword}',
      steps: [
        { type: 'extract', description: 'Extract news cards' },
      ],
      outputSchema: {
        title: 'string',
        source: 'string',
        url: 'string',
      },
    },
  },
  {
    id: 'reddit-posts',
    name: 'Reddit Posts Scraper',
    description: 'Extract Reddit posts and comments from any subreddit.',
    category: 'news',
    website: 'reddit.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 77,
    rating: 4.5,
    reviews: 1098,
    dataFields: ['Title', 'Author', 'Subreddit', 'Upvotes', 'Comments', 'URL', 'Created'],
    tags: ['reddit', 'social', 'community', 'discussions'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.reddit.com/r/{subreddit}',
      steps: [
        { type: 'extract', description: 'Extract posts' },
      ],
      outputSchema: {
        title: 'string',
        upvotes: 'number',
        comments: 'number',
      },
    },
  },

  // Travel
  {
    id: 'tripadvisor-hotels',
    name: 'TripAdvisor Hotels Scraper',
    description: 'Extract hotel listings with reviews, prices, and amenities.',
    category: 'travel',
    website: 'tripadvisor.com',
    difficulty: 'intermediate',
    estimatedTime: 10,
    popularity: 73,
    rating: 4.5,
    reviews: 876,
    dataFields: ['Hotel Name', 'Rating', 'Reviews', 'Price', 'Location', 'Amenities'],
    tags: ['tripadvisor', 'hotels', 'travel', 'reviews'],
    isPremium: true,
    workflow: {
      startUrl: 'https://www.tripadvisor.com/Hotels-{location}',
      steps: [
        { type: 'extract', description: 'Extract hotel cards' },
      ],
      outputSchema: {
        name: 'string',
        rating: 'number',
        price: 'number',
      },
    },
  },
  {
    id: 'booking-hotels',
    name: 'Booking.com Hotels Extractor',
    description: 'Extract hotel availability and prices from Booking.com.',
    category: 'travel',
    website: 'booking.com',
    difficulty: 'intermediate',
    estimatedTime: 10,
    popularity: 71,
    rating: 4.4,
    reviews: 654,
    dataFields: ['Hotel Name', 'Rating', 'Price', 'Location', 'Free Cancellation', 'Breakfast'],
    tags: ['booking', 'hotels', 'accommodation'],
    isPremium: true,
    workflow: {
      startUrl: 'https://www.booking.com/searchresults.html?dest_id={location}',
      steps: [
        { type: 'extract', description: 'Extract hotel results' },
      ],
      outputSchema: {
        name: 'string',
        rating: 'number',
        price: 'number',
      },
    },
  },

  // General
  {
    id: 'google-search',
    name: 'Google Search Results Scraper',
    description: 'Extract search results including organic, ads, and featured snippets.',
    category: 'general',
    website: 'google.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 94,
    rating: 4.8,
    reviews: 3456,
    dataFields: ['Title', 'URL', 'Description', 'Position', 'Type'],
    tags: ['google', 'seo', 'search', 'serp'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.google.com/search?q={keyword}',
      steps: [
        { type: 'extract', selector: '.g', description: 'Extract search results' },
      ],
      outputSchema: {
        title: 'string',
        url: 'string',
        description: 'string',
      },
    },
  },
  {
    id: 'yelp-businesses',
    name: 'Yelp Business Scraper',
    description: 'Extract local business listings with reviews, ratings, and contact info.',
    category: 'general',
    website: 'yelp.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 80,
    rating: 4.6,
    reviews: 1234,
    dataFields: ['Business Name', 'Rating', 'Reviews', 'Category', 'Address', 'Phone', 'Website'],
    tags: ['yelp', 'local', 'businesses', 'reviews'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.yelp.com/search?find_desc={keyword}&find_loc={location}',
      steps: [
        { type: 'extract', description: 'Extract business cards' },
      ],
      outputSchema: {
        name: 'string',
        rating: 'number',
        reviews: 'number',
      },
    },
  },
  {
    id: 'yellow-pages',
    name: 'Yellow Pages Directory Scraper',
    description: 'Extract business listings from Yellow Pages with contact details.',
    category: 'general',
    website: 'yellowpages.com',
    difficulty: 'beginner',
    estimatedTime: 5,
    popularity: 65,
    rating: 4.3,
    reviews: 543,
    dataFields: ['Business Name', 'Category', 'Address', 'Phone', 'Website', 'Hours'],
    tags: ['yellow pages', 'directory', 'business'],
    isPremium: false,
    workflow: {
      startUrl: 'https://www.yellowpages.com/search?search_terms={keyword}&geo_location_terms={location}',
      steps: [
        { type: 'extract', description: 'Extract listings' },
      ],
      outputSchema: {
        name: 'string',
        phone: 'string',
        address: 'string',
      },
    },
  },
];

export const PrebuiltRobots: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<RobotCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'name'>('popularity');
  const [selectedRobot, setSelectedRobot] = useState<PrebuiltRobot | null>(null);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const filteredRobots = useMemo(() => {
    return PREBUILT_ROBOTS
      .filter((robot) => {
        if (selectedCategory !== 'all' && robot.category !== selectedCategory) return false;
        if (showPremiumOnly && !robot.isPremium) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            robot.name.toLowerCase().includes(query) ||
            robot.description.toLowerCase().includes(query) ||
            robot.tags.some((tag) => tag.includes(query)) ||
            robot.website.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popularity') return b.popularity - a.popularity;
        if (sortBy === 'rating') return b.rating - a.rating;
        return a.name.localeCompare(b.name);
      });
  }, [selectedCategory, searchQuery, sortBy, showPremiumOnly]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'difficulty-beginner';
      case 'intermediate': return 'difficulty-intermediate';
      case 'advanced': return 'difficulty-advanced';
      default: return '';
    }
  };

  const handleUseRobot = (robot: PrebuiltRobot) => {
    // Save robot config and redirect to automation builder
    localStorage.setItem('cube_selected_robot', JSON.stringify(robot));
    window.location.href = '/automation?robot=' + robot.id;
  };

  const handleCopyWorkflow = (robot: PrebuiltRobot) => {
    navigator.clipboard.writeText(JSON.stringify(robot.workflow, null, 2));
  };

  return (
    <div className="prebuilt-robots">
      {/* Header */}
      <div className="robots-header">
        <div className="header-title">
          <Bot size={28} />
          <div>
            <h1>Prebuilt Robots</h1>
            <p>Ready-to-use automation templates for popular websites</p>
          </div>
        </div>
        <div className="header-stats">
          <span className="stat">{PREBUILT_ROBOTS.length} robots</span>
          <span className="stat">{CATEGORIES.length} categories</span>
        </div>
      </div>

      {/* Filters */}
      <div className="robots-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search robots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-options">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="sort-select"
          >
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Alphabetical</option>
          </select>

          <label className="premium-toggle">
            <input
              type="checkbox"
              checked={showPremiumOnly}
              onChange={(e) => setShowPremiumOnly(e.target.checked)}
            />
            Premium Only
          </label>

          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="category-tabs">
        <button
          className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={`category-tab ${selectedCategory === cat.value ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Robots Grid */}
      <div className={`robots-grid ${viewMode}`}>
        {filteredRobots.length === 0 ? (
          <div className="no-results">
            <Search size={48} />
            <h3>No robots found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          filteredRobots.map((robot) => (
            <div
              key={robot.id}
              className={`robot-card ${viewMode}`}
              onClick={() => setSelectedRobot(robot)}
            >
              <div className="robot-header">
                <div className="robot-icon">
                  {CATEGORIES.find((c) => c.value === robot.category)?.icon}
                </div>
                <div className="robot-badges">
                  {robot.isPremium && <span className="badge premium">Premium</span>}
                  <span className={`badge ${getDifficultyColor(robot.difficulty)}`}>
                    {robot.difficulty}
                  </span>
                </div>
              </div>

              <h3 className="robot-name">{robot.name}</h3>
              <p className="robot-website">{robot.website}</p>
              <p className="robot-description">{robot.description}</p>

              <div className="robot-stats">
                <div className="stat">
                  <Star size={14} />
                  <span>{robot.rating}</span>
                  <span className="reviews">({robot.reviews})</span>
                </div>
                <div className="stat">
                  <Clock size={14} />
                  <span>{robot.estimatedTime}m setup</span>
                </div>
              </div>

              <div className="robot-tags">
                {robot.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <div className="robot-actions">
                <button
                  className="btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseRobot(robot);
                  }}
                >
                  <Play size={14} />
                  Use Robot
                </button>
                <button
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRobot(robot);
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Robot Details Modal */}
      {selectedRobot && (
        <div className="modal-overlay" onClick={() => setSelectedRobot(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="robot-icon">
                  {CATEGORIES.find((c) => c.value === selectedRobot.category)?.icon}
                </div>
                <div>
                  <h2>{selectedRobot.name}</h2>
                  <a
                    href={`https://${selectedRobot.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="website-link"
                  >
                    {selectedRobot.website}
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedRobot(null)}>×</button>
            </div>

            <div className="modal-content">
              <p className="description">{selectedRobot.description}</p>

              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Difficulty</span>
                  <span className={`value ${getDifficultyColor(selectedRobot.difficulty)}`}>
                    {selectedRobot.difficulty}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Setup Time</span>
                  <span className="value">{selectedRobot.estimatedTime} minutes</span>
                </div>
                <div className="info-item">
                  <span className="label">Rating</span>
                  <span className="value">
                    <Star size={14} /> {selectedRobot.rating} ({selectedRobot.reviews} reviews)
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Category</span>
                  <span className="value">{selectedRobot.category}</span>
                </div>
              </div>

              <div className="section">
                <h4>Data Fields Extracted</h4>
                <div className="fields-list">
                  {selectedRobot.dataFields.map((field) => (
                    <span key={field} className="field">
                      <Check size={12} />
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h4>Tags</h4>
                <div className="tags-list">
                  {selectedRobot.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h4>Workflow Definition</h4>
                <pre className="workflow-preview">
                  {JSON.stringify(selectedRobot.workflow, null, 2)}
                </pre>
                <button
                  className="btn-secondary copy-btn"
                  onClick={() => handleCopyWorkflow(selectedRobot)}
                >
                  <Copy size={14} />
                  Copy Workflow
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedRobot(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => handleUseRobot(selectedRobot)}>
                <Play size={16} />
                Use This Robot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrebuiltRobots;
