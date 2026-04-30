export default {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-order"],
  rules: {
    "order/properties-alphabetical-order": true,
    // Allow BEM double-dash modifier pattern (e.g. .card--active, .section--break)
    "selector-class-pattern": [
      "^[a-z][a-z0-9-]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?$",
      { message: "Expected BEM-compatible kebab-case class selector" },
    ],
    // Vendor prefixes are intentional — no autoprefixer in this build
    "property-no-vendor-prefix": null,
    // Keep max-width / min-width notation (more readable than context range syntax)
    "media-feature-range-notation": null,
  },
};
