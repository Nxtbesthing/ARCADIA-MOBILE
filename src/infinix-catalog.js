const model = (series, storages, colors) => ({
  series,
  storages: Object.fromEntries(storages.map((storage) => [storage, colors.map((color) => typeof color === "string" ? { color, availability: "standard" } : { ...color })]))
});

const exclusive = (color, availability = "region-specific") => ({ color, availability });

export const infinixCatalog = {
  "Infinix NOTE 30 Pro": model("NOTE", ["256GB"], ["Magic Black", "Variable Gold"]),
  "Infinix NOTE 30 5G": model("NOTE", ["128GB", "256GB"], ["Sunset Gold", "Magic Black", "Interstellar Blue"]),
  "Infinix NOTE 30": model("NOTE", ["128GB", "256GB"], ["Classic Black", "Blue", "Sunset Gold"]),
  "Infinix NOTE 40": model("NOTE", ["256GB"], ["Titan Gold", "Obsidian Black", "Vintage Green"]),
  "Infinix NOTE 40 Pro": model("NOTE", ["256GB", "512GB"], ["Vintage Green", "Titan Gold", "Titanium Grey"]),
  "Infinix NOTE 40 Pro 5G": model("NOTE", ["256GB", "512GB"], ["Titanium Grey", "Vintage Green", "Obsidian Black"]),
  "Infinix NOTE 40 Pro+ 5G": model("NOTE", ["512GB"], ["Vintage Green", "Titan Gold", "Obsidian Black"]),
  "Infinix NOTE 50": model("NOTE", ["256GB", "512GB"], ["Titanium Grey", "Ruby Red", "Mountain Mist"]),
  "Infinix NOTE 50 Pro": model("NOTE", ["256GB", "512GB"], ["Titanium Grey", "Leather Black", "Mystical Purple"]),
  "Infinix NOTE 50 Pro+ 5G": model("NOTE", ["256GB", "512GB"], ["Titanium Grey", "Enchanted Purple", "Shadow Black"]),
  "Infinix ZERO 30 5G": model("ZERO", ["256GB"], ["Golden Hour", "Rome Green", "Fantasy Purple"]),
  "Infinix ZERO 30": model("ZERO", ["256GB"], ["Sunset Gold", "Rome Green", "Pearl White"]),
  "Infinix ZERO 40": model("ZERO", ["256GB", "512GB"], ["Rock Black", "Titanium Grey", "Violet Garden"]),
  "Infinix ZERO 40 5G": model("ZERO", ["256GB", "512GB"], ["Titanium Grey", "Garden Green", "Moving Titanium"]),
  "Infinix ZERO Flip": model("ZERO", ["512GB"], ["Blossom Glow", "Rock Black", "Vintage Gold"]),
  "Infinix GT 30 Pro": model("GT", ["256GB", "512GB"], ["Dark Flare", "Blade White", "Shadow Ash"]),
  "Infinix GT 30": model("GT", ["256GB", "512GB"], ["Cyber Blue", "Pulse Green", "Mecha Orange"]),
  "Infinix GT 20 Pro": model("GT", ["256GB"], ["Mecha Blue", "Mecha Orange", "Mecha Silver"]),
  "Infinix GT 10 Pro": model("GT", ["256GB"], ["Cyber Black", "Mirage Silver"]),
  "Infinix HOT 60 Pro": model("HOT", ["128GB", "256GB"], ["Sleek Black", "Titanium Grey", "Sapphire Blue"]),
  "Infinix HOT 60 Pro+": model("HOT", ["256GB", "512GB"], ["Titanium Grey", "Coral Tides", "Mist Blue"]),
  "Infinix HOT 60": model("HOT", ["128GB", "256GB"], ["Sleek Black", "Misty Teal", "Titanium Grey"]),
  "Infinix HOT 50 Pro+": model("HOT", ["256GB"], ["Titanium Grey", "Sage Green", "Glacier Blue"]),
  "Infinix HOT 50 Pro": model("HOT", ["128GB", "256GB"], ["Titanium Grey", "Sage Green", "Glacier Blue"]),
  "Infinix HOT 50": model("HOT", ["128GB", "256GB"], ["Sleek Black", "Sage Green", "Titanium Grey"]),
  "Infinix HOT 40 Pro": model("HOT", ["128GB", "256GB"], ["Horizon Gold", "Starlit Black", "Palm Blue"]),
  "Infinix SMART 10": model("SMART", ["64GB", "128GB"], ["Sleek Black", "Titanium Silver", "Emerald Green"]),
  "Infinix SMART 9": model("SMART", ["64GB", "128GB"], ["Metallic Black", "Neo Titanium", "Mint Green"]),
  "Infinix SMART 8": model("SMART", ["64GB", "128GB"], ["Shiny Gold", "Galaxy White", "Timber Black"]),
  "Infinix SMART 7": model("SMART", ["64GB"], ["Polar Black", "Coastal Green", "Iris Purple"])
};

export const infinixModels = Object.keys(infinixCatalog);

export function getInfinixColors(modelName, storage) {
  return infinixCatalog[modelName]?.storages?.[storage]?.map(({ color }) => color) || [];
}

export function isValidInfinixVariant(modelName, storage, color) {
  return getInfinixColors(modelName, storage).includes(color);
}
