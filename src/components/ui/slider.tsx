import * as React from "react"
export const Slider = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
Slider.displayName = "Slider"
