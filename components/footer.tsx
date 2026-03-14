import { Link2 } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link2 className="w-4 h-4" />
          <span className="text-sm font-medium">The ROOT Indexer</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm text-muted-foreground">
            Developed by <a className="font-semibold text-foreground" href="https://friedrichruiz.netlify.app/" target="_blank">Friedrich Ruiz</a>
          </p>
          <p className="text-xs text-muted-foreground/60">
            Built for programmers, by programmers
          </p>
        </div>
      </div>
    </footer>
  )
}
