const model = (storages, colors) => ({
  storages: Object.fromEntries(storages.map((storage) => [storage, colors.map((color) => typeof color === "string" ? { color, availability: "standard" } : { ...color })]))
});

const exclusive = (color, availability = "region-specific") => ({ color, availability });

export const tecnoCatalog = {
  "TECNO CAMON 50": model(["128GB", "256GB"], ["Black", "Silver", "Green"]),
  "TECNO CAMON 50 Pro": model(["256GB", "512GB"], ["Black", "Silver", "Green"]),
  "TECNO CAMON 50 Ultra": model(["512GB", "1TB"], ["Black", "Silver", "Green"]),
  "TECNO CAMON 40": model(["128GB", "256GB"], ["Galaxy Black", "Glacier White", "Emerald Glow"]),
  "TECNO CAMON 40 Pro": model(["256GB", "512GB"], ["Galaxy Black", "Emerald Glow", "Vulcanic Gray"]),
  "TECNO CAMON 40 Pro 5G": model(["256GB", "512GB"], ["Galaxy Black", "Emerald Glow", "Vulcanic Gray"]),
  "TECNO CAMON 40 Premier 5G": model(["512GB"], ["Galaxy Black", "Emerald Glow", "Vulcanic Gray"]),
  "TECNO CAMON 30": model(["256GB", "512GB"], ["Classic Skin", "Basaltic Dark", "Cedar Green", "Salt White"]),
  "TECNO CAMON 30 5G": model(["256GB", "512GB"], ["Meta Black", "Natural Green", "Ice Blue"]),
  "TECNO CAMON 30 Pro 5G": model(["512GB"], ["Glass Black", "White"]),
  "TECNO POVA 8": model(["128GB", "256GB"], ["Black", "Silver", "Green"]),
  "TECNO POVA 8 Pro": model(["256GB", "512GB"], ["Black", "Silver", "Green"]),
  "TECNO POVA Curve": model(["128GB", "256GB"], ["Geek Black", "Neon Cyan", "Silver"]),
  "TECNO POVA Curve 5G": model(["256GB", "512GB"], ["Geek Black", "Neon Cyan", "Silver"]),
  "TECNO POVA 7": model(["128GB", "256GB"], ["Geek Black", "Hacker Green", "Magic Silver"]),
  "TECNO POVA 7 Pro 5G": model(["256GB", "512GB"], ["Geek Black", "Hacker Green", "Magic Silver"]),
  "TECNO POVA 7 Ultra 5G": model(["512GB"], ["Geek Black", "Hacker Green", "Magic Silver"]),
  "TECNO POVA 6": model(["256GB"], ["Comet Green", "Meteorite Gray", "Interstellar Blue"]),
  "TECNO POVA 6 Pro 5G": model(["256GB", "512GB"], ["Comet Green", "Meteorite Gray", "Interstellar Blue"]),
  "TECNO SPARK 50": model(["128GB", "256GB"], ["Halo Blue", "Emerald Glow", "Titanium Gray"]),
  "TECNO SPARK 50 Pro": model(["256GB", "512GB"], ["Halo Blue", "Emerald Glow", "Titanium Gray"]),
  "TECNO SPARK 50 Pro+": model(["256GB", "512GB"], ["Obsidian Black", "Lunar White", "Azure Blue"]),
  "TECNO SPARK 50 5G": model(["128GB", "256GB"], ["Halo Blue", "Obsidian Black", "Lunar White"]),
  "TECNO SPARK Slim": model(["128GB", "256GB"], ["Titanium Gray", "Emerald Green", "Lunar White"]),
  "TECNO SPARK 40": model(["128GB", "256GB"], ["Ink Black", "Titanium Gray", "Veil White"]),
  "TECNO SPARK 40 Pro": model(["256GB", "512GB"], ["Ink Black", "Titanium Gray", "Veil White"]),
  "TECNO SPARK 40 Pro+": model(["256GB", "512GB"], ["Galaxy Blue", "Moon Titanium", "Aurora Cloud"]),
  "TECNO SPARK 30": model(["128GB", "256GB"], ["Astral Ice", "Orbit Black", "Yonder Silver"]),
  "TECNO SPARK 30 Pro": model(["128GB", "256GB"], ["Glass Black", "Glass White", "Neon Gold"]),
  "TECNO SPARK 30 5G": model(["128GB", "256GB"], ["Startrail Black", "Neon Gold", "Azure Sky"]),
  "TECNO PHANTOM V Fold2 5G": model(["512GB"], ["Karst Green", "Rippling Blue"]),
  "TECNO PHANTOM V Flip2 5G": model(["256GB"], ["Travertine Green", "Moondust Gray"]),
  "TECNO PHANTOM X2": model(["256GB", "512GB"], ["Stardust Gray", "Moonlight Silver"]),
  "TECNO PHANTOM X2 Pro": model(["256GB", "512GB"], ["Mars Orange", "Stardust Gray"]),
  "TECNO POP 10": model(["64GB", "128GB"], ["Startrail Black", "Magic Skin Green", "Dreamy Purple"]),
  "TECNO POP 9": model(["64GB", "128GB"], ["Glittery Black", "Secret Silver", "Lime Green"]),
  "TECNO POP 8": model(["64GB", "128GB"], ["Mystery White", "Alpenglow Gold", "Gravity Black"])
};

export const tecnoModels = Object.keys(tecnoCatalog);

export function getTecnoColors(modelName, storage) {
  return tecnoCatalog[modelName]?.storages?.[storage]?.map(({ color }) => color) || [];
}

export function isValidTecnoVariant(modelName, storage, color) {
  return getTecnoColors(modelName, storage).includes(color);
}
