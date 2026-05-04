type Props = {
  name: string;
  className?: string;
  fill?: boolean;
};

export default function MaterialIcon({ name, className = '', fill = false }: Props) {
  return (
    <span
      aria-hidden
      className={`material-symbols-rounded ${className}`.trim()}
      style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 500, 'GRAD' 0, 'opsz' 24` }}
    >
      {name}
    </span>
  );
}
