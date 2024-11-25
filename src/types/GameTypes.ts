import ColorFuncType from "./ColorFuncType"
import FrameworkVariantType from "./FrameworkVariantType"

type GameTypes = {
    name: string
    display: string
    color: ColorFuncType
    variants: FrameworkVariantType[]
}
export default GameTypes