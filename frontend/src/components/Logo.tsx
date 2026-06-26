import Link from "next/link";

/** Marca Mesa Arcana — selo "M" dourado + wordmark serifado. */
export function Logo({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className={`logo${small ? " sm" : ""}`} style={{ color: "inherit" }}>
      <span className="mark">M</span>
      <span className="word">Mesa Arcana</span>
    </Link>
  );
}
