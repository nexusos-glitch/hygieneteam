import * as React from "react"
export const Separator = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
Separator.displayName = "Separator"
