import { mediaUrl } from '../lib/media';

type PrizePhotoProps = {
  imageUrl?: string | null;
  alt: string;
  variant?: 'card' | 'hero';
};

export function PrizePhoto({ imageUrl, alt, variant = 'card' }: PrizePhotoProps) {
  if (!imageUrl) {
    return (
      <div className={`prize-frame ${variant} empty`} role="img" aria-label="Foto do produto indisponível">
        Sem foto do produto
      </div>
    );
  }

  return (
    <div className={`prize-frame ${variant}`}>
      <img className={`prize-photo ${variant}`} src={mediaUrl(imageUrl)} alt={alt} />
    </div>
  );
}
