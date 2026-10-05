// Thin wrapper around a Material Symbols glyph so call sites read as
// <Icon name="grid_view" /> instead of repeating the raw span everywhere.
export default function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}
