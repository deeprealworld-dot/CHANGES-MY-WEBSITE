// A template (unlike a layout) is created fresh on every navigation, so this wrapper's entry
// animation replays each time a visitor moves to another page. See ".route-enter" in globals.css.
// It only fades: a transform here would make it the containing block of every fixed header below it.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
