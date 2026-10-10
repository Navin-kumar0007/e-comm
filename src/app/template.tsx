// Page wrapper. It used to fade every page in from opacity 0 with JavaScript, which kept the
// whole page invisible until scripts loaded (6–7 s on slow phones). The slide-in below is pure
// CSS and never hides content, so the page paints as soon as the HTML arrives.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
