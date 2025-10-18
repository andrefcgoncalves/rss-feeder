#!/bin/bash

# Example usage script for the Gemini RSS Generator

# Configuration
FUNCTION_URL="https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/ingestUrl"
API_TOKEN="your-secure-api-token-here"
RSS_FEED_URL="https://storage.googleapis.com/YOUR-PROJECT.appspot.com/rss-feed.xml"

echo "📰 Gemini RSS Generator - Example Usage"
echo "======================================"

# Function to add URL to RSS feed
add_url_to_feed() {
    local url=$1
    echo "🔄 Adding URL to RSS feed: $url"
    
    response=$(curl -s -w "\\n%{http_code}" -X POST "$FUNCTION_URL" \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer $API_TOKEN" \\
        -d "{\"url\": \"$url\"}")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Successfully added to RSS feed"
        echo "$response_body" | jq '.'
    else
        echo "❌ Failed to add URL (HTTP $http_code)"
        echo "$response_body"
    fi
}

# Function to check RSS feed
check_feed() {
    echo "📡 Checking RSS feed: $RSS_FEED_URL"
    
    if curl -s --head "$RSS_FEED_URL" | head -n 1 | grep -q "200 OK"; then
        echo "✅ RSS feed is accessible"
        
        # Get feed stats
        item_count=$(curl -s "$RSS_FEED_URL" | grep -c "<item>")
        echo "📊 Current items in feed: $item_count"
        
        # Show latest item title
        latest_title=$(curl -s "$RSS_FEED_URL" | grep -A 1 "<item>" | grep "<title>" | head -1 | sed 's/<[^>]*>//g' | xargs)
        if [ ! -z "$latest_title" ]; then
            echo "📖 Latest item: $latest_title"
        fi
    else
        echo "❌ RSS feed is not accessible"
    fi
}

# Example URLs to add
example_urls=(
    "https://example.com/article1"
    "https://example.com/blog/post1"
    "https://example.com/news/story1"
)

echo ""
echo "🔧 Setup Instructions:"
echo "1. Update FUNCTION_URL with your actual Cloud Function URL"
echo "2. Update API_TOKEN with your secure token"
echo "3. Update RSS_FEED_URL with your Storage bucket URL"
echo ""

# Check if configuration looks like defaults
if [[ "$FUNCTION_URL" == *"YOUR-"* ]] || [[ "$API_TOKEN" == "your-secure-"* ]]; then
    echo "⚠️  Please update the configuration variables in this script before running examples."
    exit 1
fi

echo "📝 Examples:"
echo ""

# Add example URLs
for url in "${example_urls[@]}"; do
    add_url_to_feed "$url"
    echo ""
    sleep 2  # Rate limiting
done

# Check the feed
check_feed

echo ""
echo "🎯 Integration with RSS Readers:"
echo "Add this URL to your RSS reader: $RSS_FEED_URL"
echo ""
echo "📚 Common RSS Readers:"
echo "- Feedly: https://feedly.com"
echo "- Inoreader: https://inoreader.com"
echo "- NewsBlur: https://newsblur.com"
echo "- RSS Guard, QuiteRSS (desktop apps)"