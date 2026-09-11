const model = (storages, colors) => ({
  storages: Object.fromEntries(storages.map((storage) => [storage, colors.map((color) => typeof color === "string" ? { color, availability: "standard" } : { ...color })]))
});

const exclusive = (color, availability = "region-specific") => ({ color, availability });

export const itelCatalog = {
  "itel A100": model(["64GB", "128GB"], ["Dreamy Blue", "Midnight Black", "Nebula Purple"]),
  "itel A90": model(["64GB", "128GB"], ["Starry Black", "Glacier Blue", "Aurora Purple"]),
  "itel A80": model(["128GB"], ["Sandstone Black", "Space Blue", "Blush Gold"]),
  "itel A70": model(["64GB", "128GB"], ["Starry Black", "Brilliant Gold", "Field Green"]),
  "itel A60s": model(["64GB", "128GB"], ["Shadow Black", "Glacier Blue", "Moonlit Violet"]),
  "itel S25": model(["128GB", "256GB"], ["Bromo Black", "Mambo Mint", "Galaxy White"]),
  "itel S25 Ultra": model(["256GB"], ["Meteor Titanium", "Racing Green", "Sakura Pink"]),
  "itel P65": model(["128GB", "256GB"], ["Galaxy Blue", "Cyber Black", "Royal Green"]),
  "itel P55": model(["128GB", "256GB"], ["Royal Green", "Galaxy Blue", "Meteor Purple"]),
  "itel P55+": model(["256GB"], ["Royal Green", "Galaxy Blue", "Meteor Purple"]),
  "itel RS4": model(["128GB", "256GB"], ["Silvery White", "Elegant Blue", "Lurex Black"]),
  "itel RS4 Pro": model(["256GB"], ["Silvery White", "Elegant Blue", "Lurex Black"]),
  "itel Flip One": model(["128MB"], ["Black", "Blue", "Pink"]),
  "itel A05s": model(["32GB", "64GB"], ["Glacier Green", "Nebula Black", "Violet Blue"]),
  "itel A04": model(["32GB", "64GB"], ["City Blue", "Lavender Purple", "Black"]),
  "itel P40": model(["64GB", "128GB"], ["Force Black", "Dreamy Blue", "Sonic Gold"]),
  "itel P40+": model(["128GB"], ["Force Black", "Dreamy Blue", "Sonic Gold"])
};

export const itelModels = Object.keys(itelCatalog);

export function getItelColors(modelName, storage) {
  return itelCatalog[modelName]?.storages?.[storage]?.map(({ color }) => color) || [];
}

export function isValidItelVariant(modelName, storage, color) {
  return getItelColors(modelName, storage).includes(color);
}
