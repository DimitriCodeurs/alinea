import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu'
import css from './DropdownMenu.module.scss'
import {fromModule} from './util/Styler'

const styles = fromModule(css)

export namespace DropdownMenu {
  export const Root = RadixDropdownMenu.Root
  export const Trigger = styles.trigger.toElement(RadixDropdownMenu.Trigger)
  export const Content = styles.content.toElement(RadixDropdownMenu.Content)
  export const Item = styles.item.toElement(RadixDropdownMenu.Item)
  export const CheckboxItem = RadixDropdownMenu.CheckboxItem
  export const RadioGroup = RadixDropdownMenu.RadioGroup
  export const RadioItem = styles.radioitem.toElement(
    RadixDropdownMenu.RadioItem
  )
  export const ItemIndicator = RadixDropdownMenu.ItemIndicator
  export const TriggerItem = RadixDropdownMenu.TriggerItem
  export const Label = RadixDropdownMenu.Label
  export const Separator = RadixDropdownMenu.Separator
  export const Arrow = RadixDropdownMenu.Arrow
}
