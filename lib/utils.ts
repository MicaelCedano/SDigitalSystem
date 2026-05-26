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

export function getModelSortWeight(modelName: string): number {
  const name = modelName.toLowerCase();
  
  // 1. Check for specific well-known patterns to ensure precise order of older/special models (SE, X, XS, XR, etc.)
  if (name.includes('16 pro max')) return 160.4;
  if (name.includes('16 pro')) return 160.3;
  if (name.includes('16 plus')) return 160.2;
  if (name.includes('16')) return 160.1;

  if (name.includes('15 pro max')) return 150.4;
  if (name.includes('15 pro')) return 150.3;
  if (name.includes('15 plus')) return 150.2;
  if (name.includes('15')) return 150.1;

  if (name.includes('14 pro max')) return 140.4;
  if (name.includes('14 pro')) return 140.3;
  if (name.includes('14 plus')) return 140.2;
  if (name.includes('14')) return 140.1;

  if (name.includes('13 pro max')) return 130.4;
  if (name.includes('13 pro')) return 130.3;
  if (name.includes('13 mini')) return 130.15;
  if (name.includes('13')) return 130.1;

  if (name.includes('12 pro max')) return 120.4;
  if (name.includes('12 pro')) return 120.3;
  if (name.includes('12 mini')) return 120.15;
  if (name.includes('12')) return 120.1;

  if (name.includes('11 pro max')) return 110.4;
  if (name.includes('11 pro')) return 110.3;
  if (name.includes('11')) return 110.1;

  if (name.includes('xs max')) return 100.4;
  if (name.includes('xs')) return 100.3;
  if (name.includes('xr')) return 100.2;
  if (name.includes('x')) {
    if (/\bx\b/.test(name) || name === 'x') {
      return 100.1;
    }
  }

  if (name.includes('8 plus')) return 80.2;
  if (name.includes('8')) return 80.1;

  if (name.includes('7 plus')) return 70.2;
  if (name.includes('7')) return 70.1;

  if (name.includes('se 2022') || name.includes('se 3') || name.includes('se (3')) return 125.0; // Place SE 3rd Gen
  if (name.includes('se 2020') || name.includes('se 2') || name.includes('se (2')) return 115.0; // Place SE 2nd Gen
  if (name.includes('se')) return 65.0; // Original SE

  if (name.includes('6s plus')) return 62.2;
  if (name.includes('6s')) return 62.1;
  if (name.includes('6 plus')) return 60.2;
  if (name.includes('6')) return 60.1;

  if (name.includes('5s')) return 50.3;
  if (name.includes('5c')) return 50.2;
  if (name.includes('5')) return 50.1;

  // 2. Generic fallback parser for any other model
  const numbers = name.match(/\d+/g);
  let baseWeight = 0;
  if (numbers && numbers.length > 0) {
    baseWeight = parseInt(numbers[0]) * 10;
  }

  // Apply suffix weights
  let suffixWeight = 0;
  if (name.includes('pro max') || name.includes('ultra')) {
    suffixWeight = 0.4;
  } else if (name.includes('pro')) {
    suffixWeight = 0.3;
  } else if (name.includes('plus')) {
    suffixWeight = 0.2;
  } else if (name.includes('mini')) {
    suffixWeight = 0.15;
  } else {
    suffixWeight = 0.1; // Standard
  }

  return baseWeight + suffixWeight;
}

export function sortEquipments(equipments: any[]): any[] {
  return [...equipments].sort((a, b) => {
    // 1. Compare Brands
    const brandA = (a.marca || a.deviceModel?.brand || '').trim().toLowerCase();
    const brandB = (b.marca || b.deviceModel?.brand || '').trim().toLowerCase();
    if (brandA !== brandB) {
      // Prioritize Apple to be first if one of them is Apple, otherwise alphabetical
      const isAppleA = brandA.includes('apple') || brandA.includes('iphone');
      const isAppleB = brandB.includes('apple') || brandB.includes('iphone');
      if (isAppleA && !isAppleB) return -1;
      if (!isAppleA && isAppleB) return 1;
      return brandA.localeCompare(brandB);
    }

    // 2. Compare Models using smart weight
    const modelA = (a.modelo || a.deviceModel?.modelName || '').trim();
    const modelB = (b.modelo || b.deviceModel?.modelName || '').trim();
    if (modelA.toLowerCase() !== modelB.toLowerCase()) {
      const weightA = getModelSortWeight(modelA);
      const weightB = getModelSortWeight(modelB);
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return modelA.toLowerCase().localeCompare(modelB.toLowerCase());
    }

    // 3. Compare Storage (ascending)
    const storageA = a.storageGb || a.deviceModel?.storageGb || 0;
    const storageB = b.storageGb || b.deviceModel?.storageGb || 0;
    if (storageA !== storageB) {
      return storageA - storageB;
    }

    // 4. Compare Color (alphabetically)
    const colorA = (a.color || a.deviceModel?.color || '').trim().toLowerCase();
    const colorB = (b.color || b.deviceModel?.color || '').trim().toLowerCase();
    if (colorA !== colorB) {
      return colorA.localeCompare(colorB);
    }

    // 5. Compare Grado (alphabetically)
    const gradoA = (a.grado || '').trim().toLowerCase();
    const gradoB = (b.grado || '').trim().toLowerCase();
    if (gradoA !== gradoB) {
      return gradoA.localeCompare(gradoB);
    }

    // 6. Compare IMEI (alphabetically)
    const imeiA = (a.imei || '').trim();
    const imeiB = (b.imei || '').trim();
    return imeiA.localeCompare(imeiB);
  });
}

