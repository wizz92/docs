import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import VideoEmbed from './VideoEmbed';
import AdditionalMaterialsList from './AdditionalMaterialsList';
import SectionHeading from './SectionHeading';

export default function ProcessMediaSection({ data }) {
  const videos = data?.video_guides || [];
  const materials = data?.additional_materials || [];

  if ((!videos || videos.length === 0) && (!materials || materials.length === 0)) {
    return null;
  }

  return (
    <Box sx={{ mt: 5 }}>
      <SectionHeading caption="Видео-инструкции и дополнительные материалы">
        Материалы
      </SectionHeading>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        {videos?.length > 0 && (
          <Box sx={{ mb: materials?.length > 0 ? 3 : 0 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Видео-инструкции
            </Typography>
            {videos.map((url, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <VideoEmbed key={idx} url={url} />
            ))}
          </Box>
        )}

        {materials?.length > 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Дополнительные материалы
            </Typography>
            <AdditionalMaterialsList items={materials} />
          </Box>
        )}
      </Paper>
    </Box>
  );
}

