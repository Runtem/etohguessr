const WIKI_API = 'https://jtoh.fandom.com/api.php';

module.exports = async (req, res) => {
  try {
    // Step 1: Get random tower page
    const categoryRes = await fetch(
      `${WIKI_API}?action=query&format=json&list=categorymembers&cmtitle=Category:Towers&cmlimit=500&cmtype=page`
    );
    const categoryData = await categoryRes.json();

    const pages = categoryData.query.categorymembers
      .filter(page => 
        !page.title.startsWith('User:') &&
        !page.title.startsWith('User blog:') &&
        !page.title.startsWith('File:') &&
        !page.title.includes('Blog:')
      );

    if (pages.length === 0) {
      return res.status(404).json({ error: 'No towers found' });
    }

    const randomPage = pages[Math.floor(Math.random() * pages.length)];

    // Step 2: Get images from that page
    const imageRes = await fetch(
      `${WIKI_API}?action=query&format=json&prop=images&imlimit=50&pageids=${randomPage.pageid}`
    );
    const imageData = await imageRes.json();

    const page = Object.values(imageData.query.pages)[0];
    const images = (page.images || [])
      .map(img => img.title)
      .filter(title => 
        !title.toLowerCase().endsWith('.ogg') &&
        !title.toLowerCase().endsWith('.webm') &&
        !title.toLowerCase().includes('icon')
      );

    if (images.length === 0) {
      // No images? Return just the page info
      return res.json({
        title: randomPage.title,
        imageUrl: null,
        pageUrl: `https://jtoh.fandom.com/wiki/${encodeURIComponent(randomPage.title)}`
      });
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];

    // Step 3: Get direct image URL
    const urlRes = await fetch(
      `${WIKI_API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(randomImage)}`
    );
    const urlData = await urlRes.json();

    const imgPage = Object.values(urlData.query.pages)[0];
    const imageUrl = imgPage.imageinfo?.[0]?.url || null;

    res.json({
      title: randomPage.title,
      imageUrl,
      pageUrl: `https://jtoh.fandom.com/wiki/${encodeURIComponent(randomPage.title)}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};