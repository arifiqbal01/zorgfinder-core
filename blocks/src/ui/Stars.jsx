export function Stars({ value, size = 14 }) {
  const full = Math.floor(value);
  const half = value % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const style = { fontSize: size };

  return (
    <div className="flex items-center gap-0.5 text-yellow-500" style={style}>
      {Array(full).fill(0).map((_, i) => (
        <i key={"f"+i} className="fa fa-star" />
      ))}
      {half && <i className="fa fa-star-half-o" />}
      {Array(empty).fill(0).map((_, i) => (
        <i key={"e"+i} className="fa fa-star-o" />
      ))}
    </div>
  );
}
