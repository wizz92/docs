import Box from '@mui/material/Box';

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  // Handle saved raw iframe HTML by extracting src attribute
  if (typeof url === 'string' && url.includes('<iframe')) {
    const match = url.match(/src="([^"]+)"/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    // fall through
  }
  return url;
}

export default function VideoEmbed({ url }) {
  if (!url) return null;
  const embedUrl = getYouTubeEmbedUrl(url);
  return (
    <Box sx={{ position: 'relative', paddingTop: '56.25%', mb: 2 }}>
      <Box
        component="iframe"
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 0,
          borderRadius: 1,
          bgcolor: 'common.black',
        }}
      />
    </Box>
  );
}

