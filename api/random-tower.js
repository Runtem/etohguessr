// Vercel Serverless Function: api/random-tower.js

const WIKI_API = 'https://jtoh.fandom.com/api.php';

function extractInfoboxImage(wikitext) {
  // Match the entire TowerInfobox block
  const infoboxMatch = wikitext.match(/\{\{(?:[Tt]ower[Ii]nfobox)[^}]*?\|\s*image1\s*=\s*([^\n|}]+?)(?:\||\n|\}|$)/);
  if (!infoboxMatch) return null;

  let imageName = infoboxMatch[1].trim();

  // Remove [[File:...]] wrapper if present
  const fileMatch = imageName.match(/\[\[\s*File:([^\]|]+)[^\]]*\]\]/i);
  if (fileMatch) {
    imageName = fileMatch[1];
  } else if (imageName.includes('File:')) {
    // Handle standalone File: usage
    const directFile = imageName.match(/File:([^\]|]+)/i);
    if (directFile) imageName = directFile[1];
  }

  // Remove any remaining brackets, pipes, or quotes
  imageName = imageName.split(/[|\[\]{}<>]/)[0].trim();

  return imageName || null;
}

module.exports = async (req, res) => {
  try {
    // Step 1: Get list of tower pages
    const categoryUrl = `${WIKI_API}?action=query&format=json&list=categorymembers&cmtitle=Category:Towers&cmlimit=500&cmtype=page`;
    const categoryRes = await fetch(categoryUrl);
    if (!categoryRes.ok) throw new Error(`Failed to fetch category: ${categoryRes.status}`);
    const categoryData = await categoryRes.json();

    const pages = categoryData.query?.categorymembers.filter(page =>
      !page.title.startsWith('User:') &&
      !page.title.startsWith('User blog:') &&
      !page.title.startsWith('File:') &&
      !page.title.includes('Blog:')
    );

    if (!pages || pages.length === 0) {
      return res.status(404).json({ error: 'No towers found' });
    }

    const randomPage = pages[Math.floor(Math.random() * pages.length)];

    // Step 2: Get the wikitext to extract infobox image
    const contentUrl = `${WIKI_API}?action=query&format=json&prop=revisions&rvprop=content&titles=${encodeURIComponent(randomPage.title)}`;
    const contentRes = await fetch(contentUrl);
    if (!contentRes.ok) throw new Error('Failed to fetch page content');
    const contentData = await contentRes.json();

    const page = Object.values(contentData.query.pages)[0];
    const wikitext = page.revisions?.[0]['*'] || '';

    let imageName = null;

    // Try to get image from infobox
    if (wikitext) {
      imageName = extractInfoboxImage(wikitext);
    }

    // Step 3: If no infobox image, fall back to old method: first non-icon, non-video image
    let imageUrl = null;

    if (imageName) {
      // Normalize image name
      if (!imageName.startsWith('File:')) imageName = `File:${imageName}`;
      const imageUrlRes = await fetch(
        `${WIKI_API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(imageName)}`
      );
      if (imageUrlRes.ok) {
        const urlData = await imageUrlRes.json();
        const imgPage = Object.values(urlData.query.pages)[0];
        imageUrl = imgPage.imageinfo?.[0]?.url || null;
      }
    }

    // Fallback: if no infobox image or failed to get URL
    if (!imageUrl) {
      const imageRes = await fetch(
        `${WIKI_API}?action=query&format=json&prop=images&imlimit=50&pageids=${randomPage.pageid}`
      );
      if (imageRes.ok) {
        const imageData = await imageRes.json();
        const imgPage = Object.values(imageData.query.pages)[0];
        const images = (imgPage.images || [])
          .map(img => img.title)
          .filter(title =>
            !title.toLowerCase().endsWith('.ogg') &&
            !title.toLowerCase().endsWith('.webm') &&
            !title.toLowerCase().includes('icon') &&
            !title.toLowerCase().includes('logo')
          );

        if (images.length > 0) {
          const randomImage = images[Math.floor(Math.random() * images.length)];
          const urlRes = await fetch(
            `${WIKI_API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(randomImage)}`
          );
          if (urlRes.ok) {
            const urlData = await urlRes.json();
            const imgPage = Object.values(urlData.query.pages)[0];
            imageUrl = imgPage.imageinfo?.[0]?.url || null;
          }
        }
      }
    }

    // Final response
    return res.json({
      title: randomPage.title,
      imageUrl,
      pageUrl: `https://jtoh.fandom.com/wiki/${encodeURIComponent(randomPage.title)}`
    });
  } catch (error) {
    console.error('Random Tower API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
};