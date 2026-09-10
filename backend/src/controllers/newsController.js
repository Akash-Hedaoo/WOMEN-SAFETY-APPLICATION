const https = require('https');
const NewsArticle = require('../models/NewsArticle');

const CACHE_TTL_MS = 10 * 60 * 1000;
let cachedFeed = null;
let cachedAt = 0;

const INDIA_LOCATIONS = [
  { name: 'Ahmedabad', coordinates: [72.5714, 23.0225] },
  { name: 'Bengaluru', aliases: ['Bangalore'], coordinates: [77.5946, 12.9716] },
  { name: 'Bhopal', coordinates: [77.4126, 23.2599] },
  { name: 'Chennai', coordinates: [80.2707, 13.0827] },
  { name: 'Delhi', aliases: ['New Delhi'], coordinates: [77.1025, 28.7041] },
  { name: 'Gurugram', aliases: ['Gurgaon'], coordinates: [77.0266, 28.4595] },
  { name: 'Hyderabad', coordinates: [78.4867, 17.3850] },
  { name: 'Jaipur', coordinates: [75.7873, 26.9124] },
  { name: 'Kanpur', coordinates: [80.3319, 26.4499] },
  { name: 'Kolkata', coordinates: [88.3639, 22.5726] },
  { name: 'Lucknow', coordinates: [80.9462, 26.8467] },
  { name: 'Mumbai', coordinates: [72.8777, 19.0760] },
  { name: 'Nagpur', coordinates: [79.0882, 21.1458] },
  { name: 'Noida', coordinates: [77.3910, 28.5355] },
  { name: 'Patna', coordinates: [85.1376, 25.5941] },
  { name: 'Pune', coordinates: [73.8567, 18.5204] },
  { name: 'Surat', coordinates: [72.8311, 21.1702] },
  { name: 'Thane', coordinates: [72.9781, 19.2183] },
  { name: 'Visakhapatnam', aliases: ['Vizag'], coordinates: [83.2185, 17.6868] },
  { name: 'Telangana', coordinates: [79.0193, 18.1124] },
  { name: 'Karnataka', coordinates: [75.7139, 15.3173] },
  { name: 'Maharashtra', coordinates: [75.7139, 19.7515] },
  { name: 'Tamil Nadu', coordinates: [78.6569, 11.1271] },
  { name: 'Uttar Pradesh', coordinates: [80.9462, 26.8467] },
  { name: 'West Bengal', coordinates: [88.3639, 22.5726] },
  { name: 'Rajasthan', coordinates: [75.7873, 26.9124] },
  { name: 'Gujarat', coordinates: [72.5714, 23.0225] }
];

const HIGH_RISK_TERMS = ['rape', 'sexual assault', 'gang rape', 'murder', 'killed', 'death', 'trafficking', 'kidnap', 'abduct', 'attack', 'violence', 'missing woman'];
const MEDIUM_RISK_TERMS = ['harassment', 'stalking', 'molestation', 'crime', 'complaint', 'investigation', 'arrested', 'arrest', 'safety concern', 'protest'];

function requestText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { Accept: 'application/rss+xml', 'User-Agent': 'Safe-Era women-safety news feed/1.0' } }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error(`News provider returned ${response.statusCode}`));
        resolve(body);
      });
    });
    request.setTimeout(15000, () => request.destroy(new Error('News request timed out')));
    request.on('error', reject);
  });
}

function decodeXml(value = '') {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function getTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

function parseGoogleNewsRss(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const item = match[1];
    return { title: getTag(item, 'title'), articleUrl: getTag(item, 'link'), publishedAt: getTag(item, 'pubDate'), source: getTag(item, 'source') || 'News source' };
  });
}

function classifyRisk(title) {
  const text = title.toLowerCase();
  if (HIGH_RISK_TERMS.some((term) => text.includes(term))) return { riskLevel: 'high', riskLabel: 'High reported risk' };
  if (MEDIUM_RISK_TERMS.some((term) => text.includes(term))) return { riskLevel: 'medium', riskLabel: 'Medium reported risk' };
  return { riskLevel: 'low', riskLabel: 'Awareness / low reported risk' };
}

function extractIndianLocation(title) {
  const text = title.toLowerCase();
  const match = INDIA_LOCATIONS.find((location) => [location.name, ...(location.aliases || [])].some((name) => text.includes(name.toLowerCase())));
  return match
    ? { locationName: match.name, location: { type: 'Point', coordinates: match.coordinates }, hasMapLocation: true, locationStatus: 'resolved' }
    : { locationName: null, location: null, hasMapLocation: false, locationStatus: 'not_reported' };
}

function formatArticle(article) {
  return { ...article, ...classifyRisk(article.title), ...extractIndianLocation(article.title) };
}

async function persistArticles(articles) {
  if (!articles.length) return;
  const now = new Date();
  const operations = articles.map((article) => ({
    updateOne: {
      filter: { articleUrl: article.articleUrl },
      update: {
        $set: { title: article.title, source: article.source, publishedAt: Number.isNaN(new Date(article.publishedAt).getTime()) ? null : new Date(article.publishedAt), riskLevel: article.riskLevel, riskLabel: article.riskLabel, locationName: article.locationName, location: article.location, hasMapLocation: article.hasMapLocation, locationStatus: article.locationStatus, lastSeenAt: now },
        $setOnInsert: { firstSeenAt: now }
      },
      upsert: true
    }
  }));
  try {
    await NewsArticle.bulkWrite(operations, { ordered: false });
  } catch (error) {
    if (error.code !== 'ECONNRESET') throw error;

    // Atlas can briefly reset a connection; retry the idempotent URL upserts once.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await NewsArticle.bulkWrite(operations, { ordered: false });
  }

}

async function refreshNewsFeed(forceRefresh = false) {
  if (!forceRefresh && cachedFeed && Date.now() - cachedAt < CACHE_TTL_MS) return cachedFeed;
  const params = new URLSearchParams({ q: 'women safety India', hl: 'en-IN', gl: 'IN', ceid: 'IN:en' });
  const xml = await requestText(`https://news.google.com/rss/search?${params.toString()}`);
  const articles = parseGoogleNewsRss(xml).filter((article) => article.articleUrl && article.title).map(formatArticle);
  cachedFeed = articles;
  cachedAt = Date.now();
  try {
    await persistArticles(articles);
  } catch (error) {
    console.warn('News persistence unavailable:', error.message);
  }
  return articles;
}

async function getWomenSafetyNews(req, res) {
  try {
    const articles = await refreshNewsFeed(req.query.refresh === 'true');
    return res.json({
      success: true,
      articles: articles.map(({ articleUrl, riskLevel, riskLabel, location, locationName, ...article }) => ({
        ...article,
        id: articleUrl,
        url: articleUrl,
        location: locationName || null,
        level: riskLevel,
        label: riskLabel
      })),
      cached: Date.now() - cachedAt < CACHE_TTL_MS,
      updatedAt: new Date(cachedAt).toISOString()
    });
  } catch (error) {
    console.error('Live news request failed:', error.message);
    return res.status(502).json({ success: false, message: 'Live news is temporarily unavailable. Please refresh in a few minutes.' });
  }
}

async function getMapNewsAlerts(req, res) {
  try {
    const storedAlerts = await NewsArticle.find({ hasMapLocation: true })
      .sort({ publishedAt: -1, lastSeenAt: -1 })
      .limit(100)
      .lean();
    const alerts = storedAlerts.map((article) => ({
      id: article._id.toString(),
      type: 'News alert',
      name: article.title,
      status: article.riskLabel,
      riskLevel: article.riskLevel,
      locationName: article.locationName,
      source: article.source,
      articleUrl: article.articleUrl,
      publishedAt: article.publishedAt,
      lat: article.location.coordinates[1],
      lon: article.location.coordinates[0]
    }));
    return res.json({ success: true, alerts });
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Stored news alerts are unavailable.' });
  }
}

module.exports = { getWomenSafetyNews, getMapNewsAlerts, refreshNewsFeed };
