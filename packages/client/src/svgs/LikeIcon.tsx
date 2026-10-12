import type { JSX, MouseEventHandler, CSSProperties } from 'react';

export default function LikeIcon({
  filled = false,
  onClick,
  style,
}: {
  filled?: boolean | undefined;
  onClick?: MouseEventHandler<SVGSVGElement> | undefined;
  style?: CSSProperties | undefined;
} = {}): JSX.Element {
  return (
    <svg
      onClick={onClick}
      stroke="currentColor"
      fill={filled ? 'currentColor' : 'none'}
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      style={style}
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
    </svg>
  );
}
