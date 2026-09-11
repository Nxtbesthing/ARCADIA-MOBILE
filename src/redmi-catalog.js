const model = (storages, colors) => ({
  storages: Object.fromEntries(storages.map((storage) => [storage, colors.map((color) => typeof color === "string" ? { color, availability: "standard" } : { ...color })]))
});

const exclusive = (color, availability = "region-specific") => ({ color, availability });

export const redmiCatalog = {
  "REDMI Note 15": model(["128GB", "256GB"], ["Black", "Glacier Blue", "Purple", "Forest Green"]),
  "REDMI Note 15 5G": model(["128GB", "256GB", "512GB"], ["Black", "Glacier Blue", "Purple", "Forest Green"]),
  "REDMI Note 15 Pro": model(["256GB", "512GB"], ["Midnight Black", "Titanium Gray", "Mist Purple"]),
  "REDMI Note 15 Pro 5G": model(["256GB", "512GB"], ["Midnight Black", "Titanium Gray", "Mist Purple", exclusive("Frost Blue", "region-specific")]),
  "REDMI Note 15 Pro+ 5G": model(["256GB", "512GB", "1TB"], ["Midnight Black", "Titanium Gray", "Mist Purple", exclusive("Frost Blue", "region-specific")]),
  "REDMI 15": model(["128GB", "256GB"], ["Midnight Black", "Titanium Gray", "Frost Blue"]),
  "REDMI 15 5G": model(["128GB", "256GB", "512GB"], ["Midnight Black", "Titanium Gray", "Frost Blue"]),
  "REDMI 15C": model(["128GB", "256GB"], ["Midnight Black", "Sage Green", "Ocean Blue"]),
  "REDMI 15C 5G": model(["128GB", "256GB", "512GB"], ["Midnight Black", "Sage Green", "Ocean Blue"]),
  "REDMI Note 14": model(["128GB", "256GB"], ["Midnight Black", "Mystique White", "Ivy Green"]),
  "REDMI Note 14 Pro": model(["256GB", "512GB"], ["Midnight Black", "Titanium Purple", "Phantom Blue"]),
  "REDMI Note 14 Pro+ 5G": model(["256GB", "512GB", "1TB"], ["Midnight Black", "Titanium Purple", "Frost Blue"]),
  "REDMI A5": model(["64GB", "128GB"], ["Midnight Black", "Ocean Blue", "Lake Green" ]),
  "REDMI A5 Pro": model(["128GB", "256GB"], ["Midnight Black", "Ocean Blue", "Lake Green"]),
  "REDMI 14C": model(["128GB", "256GB"], ["Midnight Black", "Sage Green", "Starry Blue"])
};

export const redmiModels = Object.keys(redmiCatalog);

export function getRedmiColors(modelName, storage) {
  return redmiCatalog[modelName]?.storages?.[storage]?.map(({ color }) => color) || [];
}

export function isValidRedmiVariant(modelName, storage, color) {
  return getRedmiColors(modelName, storage).includes(color);
}
