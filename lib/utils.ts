import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return 'N/A';
  const formatted = new Intl.DateTimeFormat('es-DO', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));

  return formatted.replace(/\.\s?m\./i, 'M').toUpperCase();
}

export function getProfileImageUrl(image: string | null | undefined) {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  
  // Si ya tiene el path completo o empieza con /, lo devolvemos tal cual
  if (image.startsWith('/profile_images/')) return image;
  if (image.startsWith('profile_images/')) return `/${image}`;
  
  // Si empieza con public/, se lo quitamos
  if (image.startsWith('public/')) {
    const cleaned = image.replace('public/', '/');
    return cleaned.startsWith('//') ? cleaned.substring(1) : cleaned;
  }

  // Caso base: añadir el prefijo
  const cleanedImage = image.startsWith('/') ? image.substring(1) : image;
  return `/profile_images/${cleanedImage}`;
}
